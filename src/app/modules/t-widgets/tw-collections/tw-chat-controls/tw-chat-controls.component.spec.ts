import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwChatControlsComponent } from './tw-chat-controls.component';

describe('TwChatControlsComponent', () => {
    let component: TwChatControlsComponent;
    let fixture: ComponentFixture<TwChatControlsComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwChatControlsComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwChatControlsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
