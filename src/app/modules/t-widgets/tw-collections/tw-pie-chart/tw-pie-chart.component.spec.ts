import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwPieChartComponent } from './tw-pie-chart.component';

describe('TwPieChartComponent', () => {
  let component: TwPieChartComponent;
  let fixture: ComponentFixture<TwPieChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwPieChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwPieChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
