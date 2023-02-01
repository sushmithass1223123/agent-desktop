import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwExternalContentComponent } from './tw-external-content.component';

describe('TwExternalContentComponent', () => {
  let component: TwExternalContentComponent;
  let fixture: ComponentFixture<TwExternalContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TwExternalContentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TwExternalContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
