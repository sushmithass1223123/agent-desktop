import { ContentChild, Directive, HostListener } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';

@Directive({
    selector: '[tChart]'
})
export class TChartDirective {
    @ContentChild(BaseChartDirective) performanceChart: Chart;

    @HostListener('maximizeEvent', ['$event'])
    maximizeEvent(state: boolean): void {
        if (state) {
            this.performanceChart.options.legend.display = true;
            this.performanceChart.options.scales.xAxes[0].gridLines.display = true;
            this.performanceChart.options.scales.yAxes[0].gridLines.display = true;
        } else {
            this.performanceChart.options.legend.display = false;
            this.performanceChart.options.scales.xAxes[0].gridLines.display = false;
            this.performanceChart.options.scales.yAxes[0].gridLines.display = false;
        }
        setTimeout(() => {
            (this.performanceChart as any).refresh();
        }, 10);
    }
}
