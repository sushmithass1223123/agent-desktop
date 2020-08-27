import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwSuActiveAgentsComponent } from './tw-su-active-agents.component';

describe('TwSuActiveAgentsComponent', () => {
  let component: TwSuActiveAgentsComponent;
  let fixture: ComponentFixture<TwSuActiveAgentsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwSuActiveAgentsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwSuActiveAgentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
