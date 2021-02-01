import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwTemplateComponent } from './tw-template.component';

describe('TwTemplateComponent', () => {
  let component: TwTemplateComponent;
  let fixture: ComponentFixture<TwTemplateComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
