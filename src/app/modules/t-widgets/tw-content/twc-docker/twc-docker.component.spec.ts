import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwcDockerComponent } from './twc-docker.component';

describe('TwcDockerComponent', () => {
    let component: TwcDockerComponent;
    let fixture: ComponentFixture<TwcDockerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TwcDockerComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TwcDockerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
