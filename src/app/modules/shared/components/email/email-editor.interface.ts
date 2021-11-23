import { EventEmitter } from '@angular/core';

export class IEmailEditor {
    body: string;
    bodyChange: typeof EventEmitter;
}
