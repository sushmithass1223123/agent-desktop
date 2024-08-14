import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwSmmCustomerDetailsComponent } from './tw-smm-customer-details.component';

describe('TwSmmCustomerDetailsComponent', () => {
    let component: TwSmmCustomerDetailsComponent;
    let fixture: ComponentFixture<TwSmmCustomerDetailsComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwSmmCustomerDetailsComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwSmmCustomerDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
