import { ContentChild, Directive, HostListener } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';

@Directive({
    selector: '[twChart]'
})
export class TWChartDirective {
    @ContentChild(BaseChartDirective) chart: Chart;

    @HostListener('maximizeEvent', ['$event'])
    maximizeEvent(state: boolean): void {
        if (state) {
            this.chart.options.legend.display = true;
            this.chart.options.scales.xAxes[0].gridLines.display = true;
            this.chart.options.scales.yAxes[0].gridLines.display = true;
        } else {
            this.chart.options.legend.display = false;
            this.chart.options.scales.xAxes[0].gridLines.display = false;
            this.chart.options.scales.yAxes[0].gridLines.display = false;
        }
        setTimeout(() => {
            (this.chart as any).refresh();
        }, 10);
    }
}
