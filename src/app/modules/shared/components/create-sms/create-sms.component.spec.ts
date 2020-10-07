import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSmsComponent } from './create-sms.component';

describe('CreateSmsComponent', () => {
  let component: CreateSmsComponent;
  let fixture: ComponentFixture<CreateSmsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateSmsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
