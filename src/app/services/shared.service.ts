import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';

@Injectable({
  providedIn: 'root'
})

export class SharedService {

  constructor() { }


  private holdMethodSubject = new Subject<void>();

  triggerHoldMethod() {
    this.holdMethodSubject.next();
  }

  getHoldMethod() {
    return this.holdMethodSubject.asObservable();
  }
}
