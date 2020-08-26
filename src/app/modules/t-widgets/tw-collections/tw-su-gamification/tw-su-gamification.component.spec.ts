import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwSuGamificationComponent } from './tw-su-gamification.component';

describe('TwSuGamificationComponent', () => {
  let component: TwSuGamificationComponent;
  let fixture: ComponentFixture<TwSuGamificationComponent>;

  beforeEach(async(() => {
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
