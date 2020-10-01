import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwGamificationComponent } from './tw-gamification.component';

describe('TwGamificationComponent', () => {
  let component: TwGamificationComponent;
  let fixture: ComponentFixture<TwGamificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwGamificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwGamificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
