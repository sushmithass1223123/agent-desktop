import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwCampaignContactComponent } from './tw-campaign-contact.component';

describe('TwCampaignContactComponent', () => {
    let component: TwCampaignContactComponent;
    let fixture: ComponentFixture<TwCampaignContactComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TwCampaignContactComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TwCampaignContactComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
