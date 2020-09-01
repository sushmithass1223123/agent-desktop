import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwVideoControlsComponent } from './tw-video-controls.component';

describe('TwVideoControlsComponent', () => {
  let component: TwVideoControlsComponent;
  let fixture: ComponentFixture<TwVideoControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwVideoControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwVideoControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
