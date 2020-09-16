import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwTransferInteractionComponent } from './tw-transfer-interaction.component';

describe('TwTransferInteractionComponent', () => {
  let component: TwTransferInteractionComponent;
  let fixture: ComponentFixture<TwTransferInteractionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwTransferInteractionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwTransferInteractionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
