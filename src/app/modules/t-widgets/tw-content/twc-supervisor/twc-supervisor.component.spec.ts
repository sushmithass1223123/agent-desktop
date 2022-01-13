import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwcSupervisorComponent } from './twc-supervisor.component';

describe('TwcSupervisorComponent', () => {
  let component: TwcSupervisorComponent;
  let fixture: ComponentFixture<TwcSupervisorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwcSupervisorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwcSupervisorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
