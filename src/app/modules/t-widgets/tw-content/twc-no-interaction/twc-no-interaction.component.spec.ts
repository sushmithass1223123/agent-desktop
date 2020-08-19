import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwcNoInteractionComponent } from './twc-no-interaction.component';

describe('TwcNoInteractionComponent', () => {
  let component: TwcNoInteractionComponent;
  let fixture: ComponentFixture<TwcNoInteractionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwcNoInteractionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwcNoInteractionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
