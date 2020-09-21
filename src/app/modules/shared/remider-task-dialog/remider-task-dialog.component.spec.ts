import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RemiderTaskDialogComponent } from './remider-task-dialog.component';

describe('RemiderTaskDialogComponent', () => {
  let component: RemiderTaskDialogComponent;
  let fixture: ComponentFixture<RemiderTaskDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RemiderTaskDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemiderTaskDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
