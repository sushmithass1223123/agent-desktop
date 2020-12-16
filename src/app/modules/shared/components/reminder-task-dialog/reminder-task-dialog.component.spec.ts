import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReminderTaskDialogComponent } from './reminder-task-dialog.component';

describe('ReminderTaskDialogComponent', () => {
  let component: ReminderTaskDialogComponent;
  let fixture: ComponentFixture<ReminderTaskDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReminderTaskDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReminderTaskDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
