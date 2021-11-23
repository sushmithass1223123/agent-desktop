import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwAdScoreComponent } from './tw-ad-score.component';

describe('TwAdScoreComponent', () => {
    let component: TwAdScoreComponent;
    let fixture: ComponentFixture<TwAdScoreComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwAdScoreComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwAdScoreComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
