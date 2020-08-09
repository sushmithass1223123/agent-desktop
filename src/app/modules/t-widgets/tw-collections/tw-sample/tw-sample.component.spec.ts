import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwSampleComponent } from './tw-sample.component';

describe('TwSampleComponent', () => {
  let component: TwSampleComponent;
  let fixture: ComponentFixture<TwSampleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwSampleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwSampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
