import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwSuAverageHandleTimeComponent } from './tw-su-average-handle-time.component';

describe('TwSuAverageHandleTimeComponent', () => {
  let component: TwSuAverageHandleTimeComponent;
  let fixture: ComponentFixture<TwSuAverageHandleTimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwSuAverageHandleTimeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwSuAverageHandleTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
