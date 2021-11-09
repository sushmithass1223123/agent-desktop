import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwEmailControlsComponent } from './tw-email-controls.component';

describe('TwEmailControlsComponent', () => {
    let component: TwEmailControlsComponent;
    let fixture: ComponentFixture<TwEmailControlsComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwEmailControlsComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwEmailControlsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
