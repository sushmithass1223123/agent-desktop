import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwcCustomComponent } from './twc-custom.component';

describe('TwcCustomComponent', () => {
  let component: TwcCustomComponent;
  let fixture: ComponentFixture<TwcCustomComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwcCustomComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwcCustomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
