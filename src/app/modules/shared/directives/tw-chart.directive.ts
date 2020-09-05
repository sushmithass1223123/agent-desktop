import { ContentChild, Directive, HostListener } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';

@Directive({
    selector: '[twChart]'
})
export class TWChartDirective {
    @ContentChild(BaseChartDirective) chart: BaseChartDirective;

    constructor() {}

    @HostListener('maximizeEvent', ['$event'])
    maximizeEvent(state: boolean): void {
        if (this.chart) {
            if (this.chart.chartType === 'doughnut' || this.chart.chartType === 'pie') {
                this.chart.options.plugins = { outlabels: { display: state } };
            }
            this.chart.legend = state;
            setTimeout(() => {
                (this.chart as any).refresh();
            }, 10);
        }
    }
}
