import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwSuWorkCodesComponent } from './tw-su-work-codes.component';

describe('TwSuWorkCodesComponent', () => {
  let component: TwSuWorkCodesComponent;
  let fixture: ComponentFixture<TwSuWorkCodesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwSuWorkCodesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwSuWorkCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
