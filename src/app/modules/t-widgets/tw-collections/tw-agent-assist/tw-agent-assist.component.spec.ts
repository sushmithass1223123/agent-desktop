import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwAgentAssistComponent } from './tw-agent-assist.component';

describe('TwAgentAssistComponent', () => {
    let component: TwAgentAssistComponent;
    let fixture: ComponentFixture<TwAgentAssistComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwAgentAssistComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwAgentAssistComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
