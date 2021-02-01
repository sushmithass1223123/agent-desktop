import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwChatPanelComponent } from './tw-chat-panel.component';

describe('TwChatPanelComponent', () => {
  let component: TwChatPanelComponent;
  let fixture: ComponentFixture<TwChatPanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwChatPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwChatPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
