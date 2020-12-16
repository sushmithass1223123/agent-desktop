import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwSuAgentActivityComponent } from './tw-su-agent-activity.component';

describe('TwSuAgentActivityComponent', () => {
  let component: TwSuAgentActivityComponent;
  let fixture: ComponentFixture<TwSuAgentActivityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwSuAgentActivityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwSuAgentActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
