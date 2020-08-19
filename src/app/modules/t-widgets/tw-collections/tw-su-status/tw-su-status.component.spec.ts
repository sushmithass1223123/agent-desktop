import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwSuStatusComponent } from './tw-su-status.component';

describe('TwSuStatusComponent', () => {
  let component: TwSuStatusComponent;
  let fixture: ComponentFixture<TwSuStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwSuStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwSuStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
