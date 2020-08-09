import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwAuxTimerComponent } from './tw-aux-timer.component';

describe('TwAuxTimerComponent', () => {
  let component: TwAuxTimerComponent;
  let fixture: ComponentFixture<TwAuxTimerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwAuxTimerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwAuxTimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
