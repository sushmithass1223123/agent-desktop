import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwSuChannelsComponent } from './tw-su-channels.component';

describe('TwSuChannelsComponent', () => {
  let component: TwSuChannelsComponent;
  let fixture: ComponentFixture<TwSuChannelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwSuChannelsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwSuChannelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
