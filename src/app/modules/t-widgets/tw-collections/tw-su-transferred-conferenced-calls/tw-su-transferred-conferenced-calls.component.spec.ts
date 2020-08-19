import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwSuTransferredConferencedCallsComponent } from './tw-su-transferred-conferenced-calls.component';

describe('TwSuTransferredConferencedCallsComponent', () => {
  let component: TwSuTransferredConferencedCallsComponent;
  let fixture: ComponentFixture<TwSuTransferredConferencedCallsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwSuTransferredConferencedCallsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwSuTransferredConferencedCallsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
