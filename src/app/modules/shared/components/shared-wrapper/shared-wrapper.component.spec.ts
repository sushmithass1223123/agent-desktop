import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedWrapperComponent } from './shared-wrapper.component';

describe('SharedWrapperComponent', () => {
  let component: SharedWrapperComponent;
  let fixture: ComponentFixture<SharedWrapperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SharedWrapperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SharedWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
