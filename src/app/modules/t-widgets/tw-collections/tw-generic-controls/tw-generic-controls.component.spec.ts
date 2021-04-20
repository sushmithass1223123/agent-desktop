import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwGenericControlsComponent } from './tw-generic-controls.component';

describe('TwGenericControlsComponent', () => {
  let component: TwGenericControlsComponent;
  let fixture: ComponentFixture<TwGenericControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TwGenericControlsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TwGenericControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
