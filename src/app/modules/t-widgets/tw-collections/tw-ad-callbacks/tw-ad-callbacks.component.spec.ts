import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwAdCallbacksComponent } from './tw-ad-callbacks.component';

describe('TwAdCallbacksComponent', () => {
  let component: TwAdCallbacksComponent;
  let fixture: ComponentFixture<TwAdCallbacksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwAdCallbacksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwAdCallbacksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
