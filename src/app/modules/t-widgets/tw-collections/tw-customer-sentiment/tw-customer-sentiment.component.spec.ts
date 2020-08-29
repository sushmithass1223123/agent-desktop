import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwCustomerSentimentComponent } from './tw-customer-sentiment.component';

describe('TwCustomerSentimentComponent', () => {
  let component: TwCustomerSentimentComponent;
  let fixture: ComponentFixture<TwCustomerSentimentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwCustomerSentimentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwCustomerSentimentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
