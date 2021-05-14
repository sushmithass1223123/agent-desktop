import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwSuAgentActivityDetailsComponent } from './tw-su-agent-activity-details.component';

describe('TwSuAgentActivityDetailsComponent', () => {
  let component: TwSuAgentActivityDetailsComponent;
  let fixture: ComponentFixture<TwSuAgentActivityDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwSuAgentActivityDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwSuAgentActivityDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
