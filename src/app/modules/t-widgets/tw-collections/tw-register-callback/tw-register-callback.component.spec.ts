import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwRegisterCallbackComponent } from './tw-register-callback.component';

describe('TwRegisterCallbackComponent', () => {
  let component: TwRegisterCallbackComponent;
  let fixture: ComponentFixture<TwRegisterCallbackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwRegisterCallbackComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwRegisterCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
