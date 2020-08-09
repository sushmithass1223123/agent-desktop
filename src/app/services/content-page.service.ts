import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ContentPageService {
    // create a private behaviour subject for viewMode
    private viewMode = new BehaviorSubject<string>('');
    viewModeObservable: Observable<string> = this.viewMode.asObservable();

    // to update the view mode
    updateViewMode(mode: string): void {
        this.viewMode.next(mode);
    }

    // to get the current view mode
    getViewMode(): string {
        return this.viewMode.value;
    }
}
