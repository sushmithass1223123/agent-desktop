import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwBroadcastComponent } from './tw-broadcast.component';

describe('TwBroadcastComponent', () => {
  let component: TwBroadcastComponent;
  let fixture: ComponentFixture<TwBroadcastComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwBroadcastComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwBroadcastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
