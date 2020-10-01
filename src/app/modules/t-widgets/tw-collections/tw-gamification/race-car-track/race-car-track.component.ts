import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChildren, ViewEncapsulation } from '@angular/core';
import { ResGamification } from 'app/interfaces';
import { isEqual } from 'lodash';

@Component({
    selector: 'race-car-track',
    templateUrl: './race-car-track.component.html',
    styleUrls: ['./race-car-track.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class RaceCarTrackComponent implements OnInit, AfterViewInit, OnChanges {
    yPositions = [0, 27.96, 55.564, 84.66];

    @ViewChildren('car') cars: any;
    @ViewChildren('board') boards: any;
    @ViewChildren('name') names: any;

    @Input() leaders: ResGamification[];
    @Input() highest: number;

    constructor() {}

    ngOnInit(): void {}

    ngAfterViewInit() {
        this.leaders?.forEach((l, i) => {
            const percent = (l.TotalPoints * 100) / this.highest;
            if (this.cars?._results[i] && this.boards?._results[i] && this.names?._results[i]) {
                this.cars._results[i].nativeElement.style.transform = `translate(${percent}px , ${this.yPositions[i]}px)`;
                this.boards._results[i].nativeElement.style.transform = `translate(${percent + (percent < 10 ? 100 : 0)}px , ${
                    this.yPositions[i]
                }px)`;
                this.names._results[i].nativeElement.innerHTML = l.AgentName || l.AgentId;
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            !isEqual(changes.leaders?.currentValue, changes.leaders?.previousValue) ||
            changes.highest?.currentValue !== changes.highest?.previousValue
        ) {
            this.leaders?.forEach((l, i) => {
                const percent = (l.TotalPoints * 100) / this.highest;
                if (this.cars?._results[i] && this.boards?._results[i] && this.names?._results[i]) {
                    this.cars._results[i].nativeElement.style.transform = `translate(${percent}px , ${this.yPositions[i]}px)`;
                    this.boards._results[i].nativeElement.style.transform = `translate(${percent + (percent < 10 ? 100 : 0)}px , ${
                        this.yPositions[i]
                    }px)`;
                    this.names._results[i].nativeElement.innerHTML = l.AgentName || l.AgentId;
                }
            });
        }
    }
}
