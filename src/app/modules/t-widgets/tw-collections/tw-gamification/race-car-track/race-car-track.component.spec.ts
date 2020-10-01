import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RaceCarTrackComponent } from './race-car-track.component';

describe('RaceCarTrackComponent', () => {
  let component: RaceCarTrackComponent;
  let fixture: ComponentFixture<RaceCarTrackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RaceCarTrackComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RaceCarTrackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
