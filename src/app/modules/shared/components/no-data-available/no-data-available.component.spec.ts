import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NoDataAvailableComponent } from './no-data-available.component';

describe('NoDataAvailableComponent', () => {
  let component: NoDataAvailableComponent;
  let fixture: ComponentFixture<NoDataAvailableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NoDataAvailableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoDataAvailableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
