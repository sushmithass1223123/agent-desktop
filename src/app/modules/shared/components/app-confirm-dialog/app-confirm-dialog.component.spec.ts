import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppConfirmDialogComponent } from './app-confirm-dialog.component';

describe('AppConfirmDialogComponent', () => {
    let component: AppConfirmDialogComponent;
    let fixture: ComponentFixture<AppConfirmDialogComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [AppConfirmDialogComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(AppConfirmDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
