import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentSkillListComponent } from './agent-skill-list.component';

describe('AgentSkillListComponent', () => {
  let component: AgentSkillListComponent;
  let fixture: ComponentFixture<AgentSkillListComponent>;

  beforeEach(async(() => {
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
