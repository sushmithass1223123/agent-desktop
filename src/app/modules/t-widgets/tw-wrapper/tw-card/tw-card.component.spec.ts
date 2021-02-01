import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwCardComponent } from './tw-card.component';

describe('TwCardComponent', () => {
  let component: TwCardComponent;
  let fixture: ComponentFixture<TwCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
