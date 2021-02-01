import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwAgentDetailsComponent } from './tw-agent-details.component';

describe('TwAgentDetailsComponent', () => {
  let component: TwAgentDetailsComponent;
  let fixture: ComponentFixture<TwAgentDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwAgentDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwAgentDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
