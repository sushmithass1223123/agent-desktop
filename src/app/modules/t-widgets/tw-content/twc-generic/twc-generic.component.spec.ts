import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwcGenericComponent } from './twc-generic.component';

describe('TwcGenericComponent', () => {
  let component: TwcGenericComponent;
  let fixture: ComponentFixture<TwcGenericComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TwcGenericComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TwcGenericComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
