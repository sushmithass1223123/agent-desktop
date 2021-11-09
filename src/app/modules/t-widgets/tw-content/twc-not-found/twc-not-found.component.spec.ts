import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwcNotFoundComponent } from './twc-not-found.component';

describe('TwcNotFoundComponent', () => {
    let component: TwcNotFoundComponent;
    let fixture: ComponentFixture<TwcNotFoundComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TwcNotFoundComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TwcNotFoundComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
