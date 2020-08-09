import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AppDataService {

  private appConfig: any;

  setConfig(data: any): void {
    if (data) {
      this.appConfig = data;
    }
  }

  getConfig(): any {
    if (this.appConfig) {
      return { ...this.appConfig };
    }
    return null;
  }
}
