import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwAdInteractionDetailsComponent } from './tw-ad-interaction-details.component';

describe('TwAdInteractionDetailsComponent', () => {
    let component: TwAdInteractionDetailsComponent;
    let fixture: ComponentFixture<TwAdInteractionDetailsComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwAdInteractionDetailsComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwAdInteractionDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
