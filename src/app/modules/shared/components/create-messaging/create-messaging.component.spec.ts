import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMessagingComponent } from './create-messaging.component';

describe('CreateMessagingComponent', () => {
  let component: CreateMessagingComponent;
  let fixture: ComponentFixture<CreateMessagingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateMessagingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateMessagingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
