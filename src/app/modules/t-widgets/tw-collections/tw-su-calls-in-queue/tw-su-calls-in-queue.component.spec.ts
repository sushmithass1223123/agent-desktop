import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwSuCallsInQueueComponent } from './tw-su-calls-in-queue.component';

describe('TwSuCallsInQueueComponent', () => {
  let component: TwSuCallsInQueueComponent;
  let fixture: ComponentFixture<TwSuCallsInQueueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwSuCallsInQueueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwSuCallsInQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
