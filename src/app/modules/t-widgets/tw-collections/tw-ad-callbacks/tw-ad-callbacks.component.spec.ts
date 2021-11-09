import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwAdCallbacksComponent } from './tw-ad-callbacks.component';

describe('TwAdCallbacksComponent', () => {
    let component: TwAdCallbacksComponent;
    let fixture: ComponentFixture<TwAdCallbacksComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwAdCallbacksComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwAdCallbacksComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
