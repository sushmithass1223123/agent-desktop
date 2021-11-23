import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WorkbenchEmailComponent } from './workbench-email.component';

describe('WorkbenchEmailComponent', () => {
    let component: WorkbenchEmailComponent;
    let fixture: ComponentFixture<WorkbenchEmailComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [WorkbenchEmailComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(WorkbenchEmailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
