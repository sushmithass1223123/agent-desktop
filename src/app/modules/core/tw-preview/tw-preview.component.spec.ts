import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwPreviewComponent } from './tw-preview.component';

describe('TwPreviewComponent', () => {
  let component: TwPreviewComponent;
  let fixture: ComponentFixture<TwPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
