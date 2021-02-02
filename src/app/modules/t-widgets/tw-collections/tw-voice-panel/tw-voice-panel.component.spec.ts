import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwVoicePanelComponent } from './tw-voice-panel.component';

describe('TwVoicePanelComponent', () => {
  let component: TwVoicePanelComponent;
  let fixture: ComponentFixture<TwVoicePanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwVoicePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwVoicePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
