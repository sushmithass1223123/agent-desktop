import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwEmailPanelComponent } from './tw-email-panel.component';

describe('TwEmailPanelComponent', () => {
    let component: TwEmailPanelComponent;
    let fixture: ComponentFixture<TwEmailPanelComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwEmailPanelComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwEmailPanelComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
