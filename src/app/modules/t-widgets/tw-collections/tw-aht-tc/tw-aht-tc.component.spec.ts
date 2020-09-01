import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwAhtTcComponent } from './tw-aht-tc.component';

describe('TwAhtTcComponent', () => {
  let component: TwAhtTcComponent;
  let fixture: ComponentFixture<TwAhtTcComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwAhtTcComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwAhtTcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
