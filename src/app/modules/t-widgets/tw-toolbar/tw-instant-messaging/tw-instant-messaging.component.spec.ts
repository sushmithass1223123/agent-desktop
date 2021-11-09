import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwInstantMessagingComponent } from './tw-instant-messaging.component';

describe('TwInstantMessagingComponent', () => {
    let component: TwInstantMessagingComponent;
    let fixture: ComponentFixture<TwInstantMessagingComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwInstantMessagingComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwInstantMessagingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
