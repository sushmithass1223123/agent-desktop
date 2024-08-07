import { SmpTemplateComponent } from './smp-template.component';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

describe('SmpTemplateComponent', () => {
    let component: SmpTemplateComponent;
    let fixture: ComponentFixture<SmpTemplateComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [SmpTemplateComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SmpTemplateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
