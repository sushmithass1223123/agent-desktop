import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwCalendarComponent } from './tw-calendar.component';

describe('TwCalendarComponent', () => {
    let component: TwCalendarComponent;
    let fixture: ComponentFixture<TwCalendarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TwCalendarComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TwCalendarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
