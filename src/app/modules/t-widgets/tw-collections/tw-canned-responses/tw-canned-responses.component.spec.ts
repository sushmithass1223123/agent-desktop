import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwCannedResponsesComponent } from './tw-canned-responses.component';

describe('TwCannedResponsesComponent', () => {
  let component: TwCannedResponsesComponent;
  let fixture: ComponentFixture<TwCannedResponsesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwCannedResponsesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwCannedResponsesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
