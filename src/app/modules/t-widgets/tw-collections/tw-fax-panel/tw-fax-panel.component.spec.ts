import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwFaxPanelComponent } from './tw-fax-panel.component';

describe('TwFaxPanelComponent', () => {
  let component: TwFaxPanelComponent;
  let fixture: ComponentFixture<TwFaxPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TwFaxPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TwFaxPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
