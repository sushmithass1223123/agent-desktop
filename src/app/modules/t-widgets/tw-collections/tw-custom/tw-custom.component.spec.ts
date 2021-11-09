import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwCustomComponent } from './tw-custom.component';

describe('TwCustomComponent', () => {
    let component: TwCustomComponent;
    let fixture: ComponentFixture<TwCustomComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwCustomComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwCustomComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
