import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwTcisIntegrationComponent } from './tw-tcis-integration.component';

describe('TwTcisIntegrationComponent', () => {
  let component: TwTcisIntegrationComponent;
  let fixture: ComponentFixture<TwTcisIntegrationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwTcisIntegrationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwTcisIntegrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
