import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SharedWrapperComponent } from './shared-wrapper.component';

describe('SharedWrapperComponent', () => {
    let component: SharedWrapperComponent;
    let fixture: ComponentFixture<SharedWrapperComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [SharedWrapperComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(SharedWrapperComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
