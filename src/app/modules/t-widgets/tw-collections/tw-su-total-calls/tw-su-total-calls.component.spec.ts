import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwSuTotalCallsComponent } from './tw-su-total-calls.component';

describe('TwSuTotalCallsComponent', () => {
  let component: TwSuTotalCallsComponent;
  let fixture: ComponentFixture<TwSuTotalCallsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwSuTotalCallsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwSuTotalCallsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
