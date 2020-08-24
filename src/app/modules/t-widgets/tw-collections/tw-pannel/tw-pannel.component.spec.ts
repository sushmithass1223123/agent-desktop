import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwPannelComponent } from './tw-pannel.component';

describe('TwPannelComponent', () => {
  let component: TwPannelComponent;
  let fixture: ComponentFixture<TwPannelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwPannelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwPannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
