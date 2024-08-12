import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WorkbenchSmpComponent } from './workbench-smp.component';

describe('WorkbenchSmpComponent', () => {
    let component: WorkbenchSmpComponent;
    let fixture: ComponentFixture<WorkbenchSmpComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [WorkbenchSmpComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(WorkbenchSmpComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
