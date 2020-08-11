import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwWallboardComponent } from './tw-wallboard.component';

describe('TwWallboardComponent', () => {
  let component: TwWallboardComponent;
  let fixture: ComponentFixture<TwWallboardComponent>;

  beforeEach(async(() => {
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
