import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwSuAgentInteractionsComponent } from './tw-su-agent-interactions.component';

describe('TwSuAgentInteractionsComponent', () => {
  let component: TwSuAgentInteractionsComponent;
  let fixture: ComponentFixture<TwSuAgentInteractionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwSuAgentInteractionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwSuAgentInteractionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
