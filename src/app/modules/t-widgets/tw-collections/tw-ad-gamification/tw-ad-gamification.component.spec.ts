import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwAdGamificationComponent } from './tw-ad-gamification.component';

describe('TwAdGamificationComponent', () => {
  let component: TwAdGamificationComponent;
  let fixture: ComponentFixture<TwAdGamificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwAdGamificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwAdGamificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
