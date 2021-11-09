import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TwAmdocsBccComponent } from './tw-amdocs-bcc.component';

describe('TwAmdocsBccComponent', () => {
    let component: TwAmdocsBccComponent;
    let fixture: ComponentFixture<TwAmdocsBccComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [TwAmdocsBccComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(TwAmdocsBccComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
