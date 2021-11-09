import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkbenchChatComponent } from './workbench-chat.component';

describe('WorkbenchChatComponent', () => {
    let component: WorkbenchChatComponent;
    let fixture: ComponentFixture<WorkbenchChatComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WorkbenchChatComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WorkbenchChatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
