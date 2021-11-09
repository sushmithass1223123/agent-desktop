import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwNotificationsComponent } from './tw-notifications.component';

describe('TwNotificationsComponent', () => {
    let component: TwNotificationsComponent;
    let fixture: ComponentFixture<TwNotificationsComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwNotificationsComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwNotificationsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
