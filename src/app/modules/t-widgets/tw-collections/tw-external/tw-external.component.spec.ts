import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwExternalComponent } from './tw-external.component';

describe('TwExternalComponent', () => {
  let component: TwExternalComponent;
  let fixture: ComponentFixture<TwExternalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TwExternalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TwExternalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
