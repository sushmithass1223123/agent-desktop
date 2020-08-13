import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwCustomerDetailsComponent } from './tw-customer-details.component';

describe('TwCustomerDetailsComponent', () => {
  let component: TwCustomerDetailsComponent;
  let fixture: ComponentFixture<TwCustomerDetailsComponent>;

  beforeEach(async(() => {
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
