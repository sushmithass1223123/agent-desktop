import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwFaxControlsComponent } from './tw-fax-controls.component';

describe('TwFaxControlsComponent', () => {
    let component: TwFaxControlsComponent;
    let fixture: ComponentFixture<TwFaxControlsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TwFaxControlsComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TwFaxControlsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
