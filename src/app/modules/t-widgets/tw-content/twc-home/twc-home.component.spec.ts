import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwcHomeComponent } from './twc-home.component';

describe('TwcHomeComponent', () => {
    let component: TwcHomeComponent;
    let fixture: ComponentFixture<TwcHomeComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwcHomeComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwcHomeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
