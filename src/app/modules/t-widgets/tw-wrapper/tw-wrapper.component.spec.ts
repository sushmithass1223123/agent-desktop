import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwWrapperComponent } from './tw-wrapper.component';

describe('TwWrapperComponent', () => {
  let component: TwWrapperComponent;
  let fixture: ComponentFixture<TwWrapperComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwWrapperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
