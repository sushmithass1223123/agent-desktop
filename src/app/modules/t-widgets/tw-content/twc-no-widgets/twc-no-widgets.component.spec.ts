import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwcNoWidgetsComponent } from './twc-no-widgets.component';

describe('TwcNoWidgetsComponent', () => {
  let component: TwcNoWidgetsComponent;
  let fixture: ComponentFixture<TwcNoWidgetsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwcNoWidgetsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwcNoWidgetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
