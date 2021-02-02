import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwcUnknownComponent } from './twc-unknown.component';

describe('TwcUnknownComponent', () => {
  let component: TwcUnknownComponent;
  let fixture: ComponentFixture<TwcUnknownComponent>;

  beforeEach(waitForAsync(() => {
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
