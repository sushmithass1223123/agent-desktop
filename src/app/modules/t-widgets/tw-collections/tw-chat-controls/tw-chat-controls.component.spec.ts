import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwChatControlsComponent } from './tw-chat-controls.component';

describe('TwChatControlsComponent', () => {
  let component: TwChatControlsComponent;
  let fixture: ComponentFixture<TwChatControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwChatControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwChatControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
