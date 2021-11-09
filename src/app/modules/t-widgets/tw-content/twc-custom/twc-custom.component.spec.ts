import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwcCustomComponent } from './twc-custom.component';

describe('TwcCustomComponent', () => {
    let component: TwcCustomComponent;
    let fixture: ComponentFixture<TwcCustomComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwcCustomComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwcCustomComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
