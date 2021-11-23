import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwBookmarksComponent } from './tw-bookmarks.component';

describe('TwBookmarksComponent', () => {
    let component: TwBookmarksComponent;
    let fixture: ComponentFixture<TwBookmarksComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TwBookmarksComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TwBookmarksComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
