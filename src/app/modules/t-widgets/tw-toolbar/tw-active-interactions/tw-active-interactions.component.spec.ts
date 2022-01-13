import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwActiveInteractionsComponent } from './tw-active-interactions.component';

describe('TwActiveInteractionsComponent', () => {
  let component: TwActiveInteractionsComponent;
  let fixture: ComponentFixture<TwActiveInteractionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwActiveInteractionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwActiveInteractionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
