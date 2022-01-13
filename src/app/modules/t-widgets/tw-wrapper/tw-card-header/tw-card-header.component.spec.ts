import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwCardHeaderComponent } from './tw-card-header.component';

describe('TwCardHeaderComponent', () => {
  let component: TwCardHeaderComponent;
  let fixture: ComponentFixture<TwCardHeaderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwCardHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwCardHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
