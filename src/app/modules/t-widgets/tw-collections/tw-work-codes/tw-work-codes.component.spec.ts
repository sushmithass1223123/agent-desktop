import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwWorkCodesComponent } from './tw-work-codes.component';

describe('TwSuWorkCodesComponent', () => {
    let component: TwWorkCodesComponent;
    let fixture: ComponentFixture<TwWorkCodesComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TwWorkCodesComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TwWorkCodesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
