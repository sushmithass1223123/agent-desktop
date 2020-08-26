import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwAdPerformanceComponent } from './tw-ad-performance.component';

describe('TwAdPerformanceComponent', () => {
  let component: TwAdPerformanceComponent;
  let fixture: ComponentFixture<TwAdPerformanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwAdPerformanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwAdPerformanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
