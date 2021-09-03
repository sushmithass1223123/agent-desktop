import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwDeflectToDigitalComponent } from './tw-deflect-to-digital.component';

describe('TwDeflectToDigitalComponent', () => {
  let component: TwDeflectToDigitalComponent;
  let fixture: ComponentFixture<TwDeflectToDigitalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TwDeflectToDigitalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TwDeflectToDigitalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
