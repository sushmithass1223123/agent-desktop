import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwAgentStatusComponent } from './tw-aux-status-chart.component';

describe('TwAgentStatusComponent', () => {
  let component: TwAgentStatusComponent;
  let fixture: ComponentFixture<TwAgentStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwAgentStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwAgentStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
