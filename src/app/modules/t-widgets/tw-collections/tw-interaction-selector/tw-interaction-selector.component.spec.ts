import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwInteractionSelectorComponent } from './tw-interaction-selector.component';

describe('TwInteractionSelectorComponent', () => {
  let component: TwInteractionSelectorComponent;
  let fixture: ComponentFixture<TwInteractionSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwInteractionSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwInteractionSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
