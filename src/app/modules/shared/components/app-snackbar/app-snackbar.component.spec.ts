import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppSnackbarComponent } from './app-snackbar.component';

describe('AppSnackbarComponent', () => {
    let component: AppSnackbarComponent;
    let fixture: ComponentFixture<AppSnackbarComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [AppSnackbarComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(AppSnackbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
