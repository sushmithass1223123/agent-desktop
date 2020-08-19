import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwSuChannelsStatusComponent } from './tw-su-channels-status.component';

describe('TwSuChannelsStatusComponent', () => {
  let component: TwSuChannelsStatusComponent;
  let fixture: ComponentFixture<TwSuChannelsStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwSuChannelsStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwSuChannelsStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
