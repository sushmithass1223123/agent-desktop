import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwcEmailComponent } from './twc-email.component';

describe('TwcEmailComponent', () => {
  let component: TwcEmailComponent;
  let fixture: ComponentFixture<TwcEmailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwcEmailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwcEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
