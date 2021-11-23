import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RaceCarTrackComponent } from './race-car-track.component';

describe('RaceCarTrackComponent', () => {
    let component: RaceCarTrackComponent;
    let fixture: ComponentFixture<RaceCarTrackComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [RaceCarTrackComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(RaceCarTrackComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
