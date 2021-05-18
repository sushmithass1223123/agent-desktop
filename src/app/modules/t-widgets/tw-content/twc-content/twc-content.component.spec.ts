import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwcContentComponent } from './twc-content.component';

describe('TwcContentComponent', () => {
  let component: TwcContentComponent;
  let fixture: ComponentFixture<TwcContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwcContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwcContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
