import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextTemplatesComponent } from './text-templates.component';

describe('TextTemplatesComponent', () => {
  let component: TextTemplatesComponent;
  let fixture: ComponentFixture<TextTemplatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TextTemplatesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
