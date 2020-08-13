import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwCustomerJourneyComponent } from './tw-customer-journey.component';

describe('TwCustomerJourneyComponent', () => {
  let component: TwCustomerJourneyComponent;
  let fixture: ComponentFixture<TwCustomerJourneyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwCustomerJourneyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwCustomerJourneyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
