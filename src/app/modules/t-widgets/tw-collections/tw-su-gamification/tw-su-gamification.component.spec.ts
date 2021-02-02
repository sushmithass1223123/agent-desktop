import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwSuGamificationComponent } from './tw-su-gamification.component';

describe('TwSuGamificationComponent', () => {
  let component: TwSuGamificationComponent;
  let fixture: ComponentFixture<TwSuGamificationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwSuGamificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwSuGamificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
