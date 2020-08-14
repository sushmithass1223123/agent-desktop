import { Component, OnInit, Input } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-resource-not-found',
    templateUrl: './resource-not-found.component.html',
    styleUrls: ['./resource-not-found.component.scss']
})
export class ResourceNotFoundComponent implements OnInit {
    isHandset$ = this.breakPointObserver.observe(Breakpoints.Handset).pipe(map((r) => r.matches));

    @Input() title: string;
    @Input() subtitle: string;
    @Input() description: string;

    constructor(private breakPointObserver: BreakpointObserver) {}

    ngOnInit(): void {}
}
