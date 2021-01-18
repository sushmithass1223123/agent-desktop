import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwUserLocationComponent } from './tw-user-location.component';

describe('TwUserLocationComponent', () => {
  let component: TwUserLocationComponent;
  let fixture: ComponentFixture<TwUserLocationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwUserLocationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwUserLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
