import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwHeatMapComponent } from './tw-heat-map.component';

describe('TwHeatMapComponent', () => {
  let component: TwHeatMapComponent;
  let fixture: ComponentFixture<TwHeatMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwHeatMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwHeatMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
