import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwAdTotalInteractionsComponent } from './tw-ad-total-interactions.component';

describe('TwAdTotalInteractionsComponent', () => {
  let component: TwAdTotalInteractionsComponent;
  let fixture: ComponentFixture<TwAdTotalInteractionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwAdTotalInteractionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwAdTotalInteractionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
