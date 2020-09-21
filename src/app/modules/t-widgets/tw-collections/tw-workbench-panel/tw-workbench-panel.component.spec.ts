import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwcWorkbenchPanelComponent } from './tw-workbench-panel.component';

describe('TwcWorkbenchPanelComponent', () => {
  let component: TwcWorkbenchPanelComponent;
  let fixture: ComponentFixture<TwcWorkbenchPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwcWorkbenchPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwcWorkbenchPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
