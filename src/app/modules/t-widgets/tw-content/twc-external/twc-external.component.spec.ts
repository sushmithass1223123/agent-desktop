import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwcExternalComponent } from './twc-external.component';

describe('TwcExternalComponent', () => {
  let component: TwcExternalComponent;
  let fixture: ComponentFixture<TwcExternalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TwcExternalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TwcExternalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
