import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CreateMessagingComponent } from './create-messaging.component';

describe('CreateMessagingComponent', () => {
  let component: CreateMessagingComponent;
  let fixture: ComponentFixture<CreateMessagingComponent>;

  beforeEach(waitForAsync(() => {
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
