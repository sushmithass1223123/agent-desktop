import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwEmailTemplatePreviewComponent } from './tw-email-template-preview.component';

describe('TwEmailTemplatePreviewComponent', () => {
  let component: TwEmailTemplatePreviewComponent;
  let fixture: ComponentFixture<TwEmailTemplatePreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwEmailTemplatePreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwEmailTemplatePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
