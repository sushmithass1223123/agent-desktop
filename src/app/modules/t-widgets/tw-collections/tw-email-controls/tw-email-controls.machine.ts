import { Injectable, OnDestroy } from '@angular/core';
import { COMMON_ERR_MESSAGE } from 'app/constants';
import { fromEventPattern, Observable, Subject, Subscription } from 'rxjs';
import { SDKClient } from 'tmac-sdk';
import { assign, interpret, Interpreter, Machine, StateMachine } from 'xstate';

@Injectable({
    providedIn: 'root'
})
export class TwEmailControlsMachine implements OnDestroy {
    subs = new Subscription();
    actions$ = new Subject();
    state$: Observable<any>;

    private service: Interpreter<any, any, any>;

    setupMachine(machine: StateMachine<any, any, any>) {
        this.service = interpret(machine);

        this.state$ = fromEventPattern(
            (handler: any) => {
                this.service.onTransition(handler).start();
                return this.service;
            },
            (handler, service) => service.stop()
        );

        this.subs.add(this.actions$.subscribe(this.service.send));
    }

    ngOnDestroy() {
        this.subs.unsubscribe();
    }
}

export const emailControlsMachine = Machine({
    id: 'email-controls',
    context: {
        getInboxEmail: { data: null, msg: '' }
    },
    initial: 'idle',
    states: {
        idle: {
            on: {
                FETCH_EMAIL: 'loading'
            }
        },
        loading: {
            invoke: {
                src: (_context, event) => SDKClient.getInboxEmail(event.sessionId),
                onDone: {
                    target: 'ready',
                    actions: assign({ getInboxEmail: (_context, event) => ({ data: event.data }) })
                },
                onError: {
                    target: 'failure',
                    actions: assign({ getInboxEmail: (_context, event) => ({ data: null, msg: COMMON_ERR_MESSAGE }) })
                }
            }
        },
        ready: {
            on: {
                SAVE_DRAFT: 'savingDraft'
            },
            states: {
                savingDraft: {
                    invoke: {
                        src: (ctx, evt: any) => SDKClient.saveEmailDraft(evt.args),
                        onDone: 'ready',
                        onError: {
                            target: 'failure',
                            actions: assign({ saveEmailDraft: (_context, event) => ({ data: null, msg: COMMON_ERR_MESSAGE }) })
                        }
                    }
                }
            }
        },
        success: {},
        failure: {}
    }
});
