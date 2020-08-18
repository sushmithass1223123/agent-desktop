import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwAdTotalCallsComponent } from './tw-ad-total-calls.component';

describe('TwAdTotalCallsComponent', () => {
  let component: TwAdTotalCallsComponent;
  let fixture: ComponentFixture<TwAdTotalCallsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwAdTotalCallsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwAdTotalCallsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
