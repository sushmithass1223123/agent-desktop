import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwEntitiesComponent } from './tw-entities.component';

describe('TwEntitiesComponent', () => {
  let component: TwEntitiesComponent;
  let fixture: ComponentFixture<TwEntitiesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwEntitiesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwEntitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
