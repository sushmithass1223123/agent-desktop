import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReminderTaskDialogComponent } from './reminder-task-dialog.component';

describe('ReminderTaskDialogComponent', () => {
    let component: ReminderTaskDialogComponent;
    let fixture: ComponentFixture<ReminderTaskDialogComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [ReminderTaskDialogComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ReminderTaskDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
