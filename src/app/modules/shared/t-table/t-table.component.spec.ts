import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TTableComponent } from './t-table.component';

describe('TTableComponent', () => {
  let component: TTableComponent;
  let fixture: ComponentFixture<TTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
