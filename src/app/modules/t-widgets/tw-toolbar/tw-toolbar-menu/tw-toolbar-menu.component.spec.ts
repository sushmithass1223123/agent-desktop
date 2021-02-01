import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwToolbarMenuComponent } from './tw-toolbar-menu.component';

describe('TwToolbarMenuComponent', () => {
  let component: TwToolbarMenuComponent;
  let fixture: ComponentFixture<TwToolbarMenuComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwToolbarMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwToolbarMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
