import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwAuxCodesComponent } from './tw-aux-codes.component';

describe('TwAuxCodesComponent', () => {
  let component: TwAuxCodesComponent;
  let fixture: ComponentFixture<TwAuxCodesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwAuxCodesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwAuxCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
