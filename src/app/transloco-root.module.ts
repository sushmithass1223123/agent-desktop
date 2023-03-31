import { HttpClient } from '@angular/common/http';
import {
  TRANSLOCO_LOADER,
  Translation,
  TranslocoLoader,
  TRANSLOCO_CONFIG,
  translocoConfig,
  TranslocoModule
} from '@ngneat/transloco';
import { Injectable, NgModule } from '@angular/core';
import { environment } from '../environments/environment';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AppDataService } from '@services/app-data.service';

let labelError;
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient,
    private appDataService: AppDataService) {}

  getTranslation(lang: string){
    try{
      if(labelError) {
        this.errorHandler(labelError);
        return;
      }
      return this.http.get<Translation>(`/assets/i18n/${lang}.json`).pipe(catchError(this.errorHandler));
    }  catch(e) {
      console.log('Error occured while fetching file in getTranslation', e);
    }
  }

  errorHandler = (error) => {
    this.appDataService.setErrorInAppLabels(error);
    this.appDataService.appLabelSubject.next(error);
    return throwError(
      'Error occured in fetching label file,please contact your admin');
  }
}



export function initConfig() {
  try{
    const jsonFile = `assets/language.json`; //path to config file
    var request = new XMLHttpRequest();
    request.open('GET', jsonFile, false);  // get app settings
    request.send(null);
    if(request.status === 404) {
      const error = {
        message: 'failed to get language configuration file:' + jsonFile
      };
      labelError = error;
      return;
    } 
    const response = JSON.parse(request.response);
    return response;
  } catch(e) {
    console.log('Error occured while fetching file in initConfig', e);
  }
}

@NgModule({
  exports: [ TranslocoModule ],
  providers: [
    {
      provide: TRANSLOCO_CONFIG,
      useValue: translocoConfig({...initConfig(),...{
        reRenderOnLangChange: true,
        prodMode: environment.production,
      }})
    },
    { provide: TRANSLOCO_LOADER, useClass: TranslocoHttpLoader }
  ]
})
export class TranslocoRootModule {}
