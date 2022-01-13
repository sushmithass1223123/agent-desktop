import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwCustomerDetailsComponent } from './tw-customer-details.component';

describe('TwCustomerDetailsComponent', () => {
  let component: TwCustomerDetailsComponent;
  let fixture: ComponentFixture<TwCustomerDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwCustomerDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwCustomerDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
