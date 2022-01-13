import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwWallboardComponent } from './tw-wallboard.component';

describe('TwWallboardComponent', () => {
  let component: TwWallboardComponent;
  let fixture: ComponentFixture<TwWallboardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TwWallboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwWallboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
