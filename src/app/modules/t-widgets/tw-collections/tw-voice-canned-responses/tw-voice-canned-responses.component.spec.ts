import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwVoiceCannedResponsesComponent } from './tw-voice-canned-responses.component';

describe('TwVoiceCannedResponsesComponent', () => {
  let component: TwVoiceCannedResponsesComponent;
  let fixture: ComponentFixture<TwVoiceCannedResponsesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwVoiceCannedResponsesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwVoiceCannedResponsesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
