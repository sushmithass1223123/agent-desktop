import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AgentSkillListComponent } from './agent-skill-list.component';

describe('AgentSkillListComponent', () => {
  let component: AgentSkillListComponent;
  let fixture: ComponentFixture<AgentSkillListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AgentSkillListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AgentSkillListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
