import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwTrsIntegrationComponent } from './tw-trs-integration.component';

describe('TwTrsIntegrationComponent', () => {
    let component: TwTrsIntegrationComponent;
    let fixture: ComponentFixture<TwTrsIntegrationComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TwTrsIntegrationComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TwTrsIntegrationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
