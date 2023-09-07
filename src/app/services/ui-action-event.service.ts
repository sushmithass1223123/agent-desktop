import { Injectable } from '@angular/core';
import { SharedWrapper } from '@modules/t-widgets/utils/widget-wrapper/shared-wrapper';
import { SDKClient } from '@tmac/sdk';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UIActionEventService extends SharedWrapper{
  private _uiActionEventArray: UIActionEvent[];
  private notifyOnUIActionEvent = new Subject<UIActionEvent>();

  constructor() { 
      super('UIEventService');
      this._uiActionEventArray = new Array();
  }

  public addUIEventListeners(label: UIActionEventNames | string, callback: (...args: any[]) => any) : void{
      SDKClient.events.on(label, callback);
  }

  public removeUIEventListeners(label: UIActionEventNames | string, callback: (...args: any[]) => any) : void{
      SDKClient.events.off(label, callback);
  }
  
  public onEmailAction = (data: any) => {
    try {
        const eventIndex = this._uiActionEventArray.findIndex(c => (c.sessionID === data.sessionID) && (c.data.type === data.type));
        if(eventIndex > -1) {
            this._uiActionEventArray.splice(eventIndex, 1);
        }
        this._uiActionEventArray.push(data);
    } catch(e) {
        console.log('Error occured on storing email UI action event',e);
    }
  }

  public getUIEvents() {
    return this._uiActionEventArray;
  } 

  public emitUIActionEvent(evt:UIActionEvent) {
      SDKClient.events.emit(evt.eventType, evt);

      this.notifyOnUIActionEvent.next(evt);
  }

  public onUIActionEvent(): Observable<UIActionEvent> {
    return this.notifyOnUIActionEvent.asObservable();
  } 

  

}

export interface UIActionEvent {
  eventName: UIActionEventNames;
  sessionID: string;
  data: any;
  eventType: 'onUIActionEvent';
}

export type UIActionEventNames = string | 'EmailAction';