import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwAccountInformationComponent } from './tw-account-information.component';

describe('TwAccountInformationComponent', () => {
  let component: TwAccountInformationComponent;
  let fixture: ComponentFixture<TwAccountInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwAccountInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwAccountInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
