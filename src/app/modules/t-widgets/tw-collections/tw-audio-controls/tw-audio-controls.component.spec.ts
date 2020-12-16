import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwAudioControlsComponent } from './tw-audio-controls.component';

describe('TwAudioControlsComponent', () => {
  let component: TwAudioControlsComponent;
  let fixture: ComponentFixture<TwAudioControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwAudioControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwAudioControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
