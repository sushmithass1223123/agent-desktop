import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwWorkbenchPanelComponent } from './tw-workbench-panel.component';

describe('TwcWorkbenchPanelComponent', () => {
    let component: TwWorkbenchPanelComponent;
    let fixture: ComponentFixture<TwWorkbenchPanelComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TwWorkbenchPanelComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TwWorkbenchPanelComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
