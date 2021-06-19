import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwcInteractionComponent } from './twc-content.component';

describe('TwcInteractionComponent', () => {
  let component: TwcInteractionComponent;
  let fixture: ComponentFixture<TwcInteractionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwcInteractionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwcInteractionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
