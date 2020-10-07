import { Component, OnInit, OnDestroy, Input, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils';
import { Subscription, timer } from 'rxjs';
import { SDKClient, AgentStatusChangeEvent } from 'tmac-sdk';
import { takeUntil } from 'rxjs/operators';

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
        if (!evt.Status.includes('On Call') || !this.lastStatus.includes('On Call')) {
            // rest the timer
            this.restartTimer();
        }
        // update last status
        this.lastStatus = evt.Status;
    }

    /**
     * Initialize timer for agent
     * @method
     */
    private initTimer(): void {
        // subscribe to the timer
        this.timerSub = timer(1000, 1000)
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(val => {
                const totalSeconds = val + 1;
                // const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor(totalSeconds % 3600 / 60);
                const seconds = Math.floor(totalSeconds % 3600 % 60);

                this.minutes1 = (minutes > 9 ? minutes.toString().substr(0, 1) : '0').toString();
                this.minutes2 = (minutes > 9 ? minutes.toString().substr(1, 2) : minutes).toString();

                this.seconds1 = (seconds > 9 ? seconds.toString().substr(0, 1) : '0').toString();
                this.seconds2 = (seconds > 9 ? seconds.toString().substr(1, 2) : seconds).toString();
            });
    }

    /**
     * Restart timer for agent
     */
    private restartTimer(): void {
        this.minutes1 = '0';
        this.minutes2 = '0';
        this.seconds1 = '0';
        this.seconds2 = '0';
        this.timerSub.unsubscribe();
        this.timerSub = null;
        this.initTimer();
    }
}
