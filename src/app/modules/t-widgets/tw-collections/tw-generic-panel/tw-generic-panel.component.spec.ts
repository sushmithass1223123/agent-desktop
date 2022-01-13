import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwGenericPanelComponent } from './tw-generic-panel.component';

describe('TwGenericPanelComponent', () => {
  let component: TwGenericPanelComponent;
  let fixture: ComponentFixture<TwGenericPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TwGenericPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TwGenericPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
