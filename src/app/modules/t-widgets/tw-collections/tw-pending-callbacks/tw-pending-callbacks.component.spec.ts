import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwPendingCallbacksComponent } from './tw-pending-callbacks.component';

describe('TwPendingCallbacksComponent', () => {
  let component: TwPendingCallbacksComponent;
  let fixture: ComponentFixture<TwPendingCallbacksComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwPendingCallbacksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwPendingCallbacksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
