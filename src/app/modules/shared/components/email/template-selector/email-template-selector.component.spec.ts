import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailTemplateSelectorComponent } from './email-template-selector.component';

describe('EmailTemplateSelectorComponent', () => {
    let component: EmailTemplateSelectorComponent;
    let fixture: ComponentFixture<EmailTemplateSelectorComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [EmailTemplateSelectorComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EmailTemplateSelectorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
