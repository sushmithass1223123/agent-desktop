import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwcWorkbenchComponent } from './twc-workbench.component';

describe('TwcWorkbenchComponent', () => {
  let component: TwcWorkbenchComponent;
  let fixture: ComponentFixture<TwcWorkbenchComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwcWorkbenchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwcWorkbenchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
