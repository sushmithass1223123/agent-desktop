import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwCreateInteractionComponent } from './tw-create-interaction.component';

describe('TwCreateInteractionComponent', () => {
    let component: TwCreateInteractionComponent;
    let fixture: ComponentFixture<TwCreateInteractionComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwCreateInteractionComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwCreateInteractionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
