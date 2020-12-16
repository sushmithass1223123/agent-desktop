import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwcTextchatComponent } from './twc-textchat.component';

describe('TwcTextchatComponent', () => {
  let component: TwcTextchatComponent;
  let fixture: ComponentFixture<TwcTextchatComponent>;

  beforeEach(async(() => {
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
