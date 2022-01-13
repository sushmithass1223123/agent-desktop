import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwComposeMessagingComponent } from './tw-compose-messaging.component';

describe('TwComposeMessagingComponent', () => {
  let component: TwComposeMessagingComponent;
  let fixture: ComponentFixture<TwComposeMessagingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwComposeMessagingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwComposeMessagingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
