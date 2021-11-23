import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwLogoutComponent } from './tw-logout.component';

describe('TwLogoutComponent', () => {
    let component: TwLogoutComponent;
    let fixture: ComponentFixture<TwLogoutComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwLogoutComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwLogoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
