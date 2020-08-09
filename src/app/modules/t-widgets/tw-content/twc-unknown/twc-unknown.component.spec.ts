import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwcUnknownComponent } from './twc-unknown.component';

describe('TwcUnknownComponent', () => {
  let component: TwcUnknownComponent;
  let fixture: ComponentFixture<TwcUnknownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwcUnknownComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwcUnknownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
