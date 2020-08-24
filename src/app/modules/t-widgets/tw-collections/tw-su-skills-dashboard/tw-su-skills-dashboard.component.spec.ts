import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwSuSkillsDashboardComponent } from './tw-su-skills-dashboard.component';

describe('TwSuSkillsDashboardComponent', () => {
  let component: TwSuSkillsDashboardComponent;
  let fixture: ComponentFixture<TwSuSkillsDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwSuSkillsDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwSuSkillsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
