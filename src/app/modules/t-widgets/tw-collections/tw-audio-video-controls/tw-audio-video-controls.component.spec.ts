import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwAudioVideoControlsComponent } from './tw-audio-video-controls.component';

describe('TwAudioVideoControlsComponent', () => {
  let component: TwAudioVideoControlsComponent;
  let fixture: ComponentFixture<TwAudioVideoControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwAudioVideoControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwAudioVideoControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
