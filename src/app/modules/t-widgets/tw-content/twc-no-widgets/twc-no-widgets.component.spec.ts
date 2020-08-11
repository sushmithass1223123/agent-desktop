import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwcNoWidgetsComponent } from './twc-no-widgets.component';

describe('TwcNoWidgetsComponent', () => {
  let component: TwcNoWidgetsComponent;
  let fixture: ComponentFixture<TwcNoWidgetsComponent>;

  beforeEach(async(() => {
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
