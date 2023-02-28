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
import LangConfig from '../assets/i18n/lang-config.json'; 
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string) {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}

export function initConfig() {
 
    const jsonFile = `assets/i18n/lang-config.json`; //path to config file
    var request = new XMLHttpRequest();
    request.open('GET', jsonFile, false);  // get app settings
    request.send(null);
    const response = JSON.parse(request.responseText);
    return response;

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
