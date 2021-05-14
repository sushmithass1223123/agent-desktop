import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwUnknownComponent } from './tw-unknown.component';

describe('TwUnknownComponent', () => {
  let component: TwUnknownComponent;
  let fixture: ComponentFixture<TwUnknownComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwUnknownComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwUnknownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
