import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwAdFeedbackComponent } from './tw-ad-feedback.component';

describe('TwAdFeedbackComponent', () => {
  let component: TwAdFeedbackComponent;
  let fixture: ComponentFixture<TwAdFeedbackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwAdFeedbackComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwAdFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
