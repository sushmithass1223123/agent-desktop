import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwVoiceBotTranscriptsComponent } from './tw-voice-bot-transcripts.component';

describe('TwVoiceBotTranscriptsComponent', () => {
  let component: TwVoiceBotTranscriptsComponent;
  let fixture: ComponentFixture<TwVoiceBotTranscriptsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwVoiceBotTranscriptsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwVoiceBotTranscriptsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
