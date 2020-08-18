import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwAdTotalAvComponent } from './tw-ad-total-av.component';

describe('TwAdTotalAvComponent', () => {
  let component: TwAdTotalAvComponent;
  let fixture: ComponentFixture<TwAdTotalAvComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwAdTotalAvComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwAdTotalAvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
