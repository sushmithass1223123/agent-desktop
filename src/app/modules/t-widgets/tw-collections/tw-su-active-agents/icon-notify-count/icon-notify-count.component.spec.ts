import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IconNotifyCountComponent } from './icon-notify-count.component';

describe('IconNotifyCountComponent', () => {
  let component: IconNotifyCountComponent;
  let fixture: ComponentFixture<IconNotifyCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IconNotifyCountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IconNotifyCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
