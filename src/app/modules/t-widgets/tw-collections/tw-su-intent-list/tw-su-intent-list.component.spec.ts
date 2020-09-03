import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwSuIntentListComponent } from './tw-su-intent-list.component';

describe('TwSuIntentListComponent', () => {
  let component: TwSuIntentListComponent;
  let fixture: ComponentFixture<TwSuIntentListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwSuIntentListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwSuIntentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
