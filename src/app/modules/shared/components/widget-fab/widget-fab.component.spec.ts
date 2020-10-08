import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetFabComponent } from './widget-fab.component';

describe('WidgetFabComponent', () => {
  let component: WidgetFabComponent;
  let fixture: ComponentFixture<WidgetFabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WidgetFabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetFabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
