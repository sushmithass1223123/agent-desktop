import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwcFaxComponent } from './twc-fax.component';

describe('TwcFaxComponent', () => {
  let component: TwcFaxComponent;
  let fixture: ComponentFixture<TwcFaxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TwcFaxComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TwcFaxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
