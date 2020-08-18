import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwAdTotalChatsComponent } from './tw-ad-total-chats.component';

describe('TwAdTotalChatsComponent', () => {
  let component: TwAdTotalChatsComponent;
  let fixture: ComponentFixture<TwAdTotalChatsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwAdTotalChatsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwAdTotalChatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
