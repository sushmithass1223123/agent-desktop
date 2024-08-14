import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwToolbarCustomComponent } from './tw-toolbar-custom.component';

describe('TwToolbarCustomComponent', () => {
    let component: TwToolbarCustomComponent;
    let fixture: ComponentFixture<TwToolbarCustomComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwToolbarCustomComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwToolbarCustomComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
