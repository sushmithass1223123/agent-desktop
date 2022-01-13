import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwWorkbenchPanelComponent } from './tw-workbench-panel.component';

describe('TwcWorkbenchPanelComponent', () => {
    let component: TwWorkbenchPanelComponent;
    let fixture: ComponentFixture<TwWorkbenchPanelComponent>;

    beforeEach(waitForAsync(() => {
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
