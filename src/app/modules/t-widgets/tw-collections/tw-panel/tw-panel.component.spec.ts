import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwPanelComponent } from './tw-panel.component';

describe('TwPanelComponent', () => {
  let component: TwPanelComponent;
  let fixture: ComponentFixture<TwPanelComponent>;

  beforeEach(waitForAsync(() => {
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
