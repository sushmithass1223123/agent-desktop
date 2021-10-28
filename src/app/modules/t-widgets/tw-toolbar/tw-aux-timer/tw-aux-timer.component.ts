import { Component, OnInit, OnDestroy, Input, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils';
import { Subscription, timer } from 'rxjs';
import { SDKClient, AgentStatusChangeEvent } from '@tmac/sdk';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { intervalToDuration } from 'date-fns';
/**
 * Aux timer component
 */
@Component({
    selector: 'tw-aux-timer',
    templateUrl: './tw-aux-timer.component.html',
    styleUrls: ['./tw-aux-timer.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAuxTimerComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * App config json data
     */
    @Input() data: any;

    /**
     * Last status of agent
     */
    lastStatus = '';

    /**
     * Timer subscription to check since last status
     */
    timerSub: Subscription;

    /**
     * Need more description
     * Minutes 1
     */
    minutes1 = '0';

    /**
     * Need more description
     * Minutes 2
     */
    minutes2 = '0';

    /**
     * Need more description
     * Minutes 3
     */
    seconds1 = '0';

    /**
     * Need more description
     * Minutes 4
     */
    seconds2 = '0';

    /**
     * Hours first digit
     */
    hours1 = '0';

    /**
     * Hours second digit
     */
    hours2 = '0';

    /**
     * Triggers restart of timer with new time
     */
    restartTimer$ = new Subject();

    constructor() {
        super();
    }

    /**
     * Lifecycle hook
     * @method
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.initTimer();
        this.restartTimer$.next(Date.now());

        // listen to agent status change
        SDKClient.events.on('AgentStatusChangeEvent', this.AgentStatusChangeEvent);
    }

    /**
     * Lifecycle hook
     * @method
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // unregister from event
        SDKClient.events.off('AgentStatusChangeEvent', this.AgentStatusChangeEvent);
    }

    /**
     * Triggered when agent changes status
     * @param {AgentStatusChangeEvent} evt
     */
    private AgentStatusChangeEvent = (evt: AgentStatusChangeEvent) => {
        // check if on call isn't sent again before restarting timer
        if (!evt.Status.includes('On Call') || !this.lastStatus.includes('On Call')) {
            // this.restartTimer$.next(evt.CreatedTime);
            this.restartTimer$.next(Date.now());
        }
        // update last status
        this.lastStatus = evt.Status;
    };

    /**
     * Initialize timer for agent
     * @method
     */
    private initTimer(): void {
        const convertToDoubleDigit = (unit: number) => {
            const unitStr = unit.toString();
            if (unitStr.length === 1) {
                return `0${unitStr}`.split('');
            }
            return unitStr.split('');
        };

        // subscribe to the timer
        this.timerSub = this.restartTimer$.pipe(takeUntil(this.unsubscribeAll)).subscribe((startTime: string) => {
            timer(1000, 1000)
                .pipe(takeUntil(this.unsubscribeAll), takeUntil(this.restartTimer$))
                .subscribe(() => {
                    const diff = intervalToDuration({
                        start: new Date(startTime),
                        end: Date.now()
                    });
                    [this.hours1, this.hours2] = convertToDoubleDigit(diff.hours);
                    [this.minutes1, this.minutes2] = convertToDoubleDigit(diff.minutes);
                    [this.seconds1, this.seconds2] = convertToDoubleDigit(diff.seconds);
                });
        });
    }
}
