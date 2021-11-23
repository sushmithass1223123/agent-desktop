import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwAhtTcComponent } from './tw-aht-tc.component';

describe('TwAhtTcComponent', () => {
    let component: TwAhtTcComponent;
    let fixture: ComponentFixture<TwAhtTcComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwAhtTcComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwAhtTcComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
