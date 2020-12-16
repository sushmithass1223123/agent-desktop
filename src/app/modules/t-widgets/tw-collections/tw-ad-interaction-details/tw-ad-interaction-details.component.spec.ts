import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwAdInteractionDetailsComponent } from './tw-ad-interaction-details.component';

describe('TwAdInteractionDetailsComponent', () => {
  let component: TwAdInteractionDetailsComponent;
  let fixture: ComponentFixture<TwAdInteractionDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwAdInteractionDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwAdInteractionDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
