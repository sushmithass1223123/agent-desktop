import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwAvailableMediaDeviceComponent } from './tw-available-media-device.component';

describe('TwAvailableMediaDeviceComponent', () => {
    let component: TwAvailableMediaDeviceComponent;
    let fixture: ComponentFixture<TwAvailableMediaDeviceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TwAvailableMediaDeviceComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TwAvailableMediaDeviceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
