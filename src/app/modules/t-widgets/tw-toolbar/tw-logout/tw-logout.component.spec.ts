import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwLogoutComponent } from './tw-logout.component';

describe('TwLogoutComponent', () => {
  let component: TwLogoutComponent;
  let fixture: ComponentFixture<TwLogoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwLogoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwLogoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
