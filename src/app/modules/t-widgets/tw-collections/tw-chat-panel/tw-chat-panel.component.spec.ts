import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwChatPanelComponent } from './tw-chat-panel.component';

describe('TwChatPanelComponent', () => {
  let component: TwChatPanelComponent;
  let fixture: ComponentFixture<TwChatPanelComponent>;

  beforeEach(async(() => {
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
