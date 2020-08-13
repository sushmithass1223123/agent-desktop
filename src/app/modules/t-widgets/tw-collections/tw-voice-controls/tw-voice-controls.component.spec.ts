import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwVoiceControlsComponent } from './tw-voice-controls.component';

describe('TwVoiceControlsComponent', () => {
  let component: TwVoiceControlsComponent;
  let fixture: ComponentFixture<TwVoiceControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwVoiceControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwVoiceControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
