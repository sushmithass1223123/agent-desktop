import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwcVoiceComponent } from './twc-voice.component';

describe('TwcVoiceComponent', () => {
  let component: TwcVoiceComponent;
  let fixture: ComponentFixture<TwcVoiceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwcVoiceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwcVoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
