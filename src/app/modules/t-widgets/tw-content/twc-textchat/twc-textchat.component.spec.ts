import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwcTextchatComponent } from './twc-textchat.component';

describe('TwcTextchatComponent', () => {
  let component: TwcTextchatComponent;
  let fixture: ComponentFixture<TwcTextchatComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwcTextchatComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwcTextchatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
