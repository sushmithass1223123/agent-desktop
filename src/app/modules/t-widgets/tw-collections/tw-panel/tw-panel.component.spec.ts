import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwPanelComponent } from './tw-panel.component';

describe('TwPanelComponent', () => {
  let component: TwPanelComponent;
  let fixture: ComponentFixture<TwPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
