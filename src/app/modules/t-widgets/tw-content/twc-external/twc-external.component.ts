import { HttpClientModule, HttpContext, HttpRequest } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewEncapsulation } from '@angular/core';
import { TWContentWrapper } from '@modules/t-widgets/utils/widget-wrapper/twc-wrapper';
import { ContentPageService } from '@services/content-page.service';
import { SDKClient } from '@tmac/sdk';
import { HttpClient } from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';
@Component({
  selector: 'twc-external',
  templateUrl: './twc-external.component.html',
  styleUrls: ['./twc-external.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class TwcExternalComponent extends TWContentWrapper implements OnInit {


   /**
     * Url to load the frame
     */
    url: any;

    /**
     * Frame loaded flag
     */
     loaded = false;

     myTemplate;
  constructor(public hostElement: ElementRef,
    public contentPageService: ContentPageService,
    public http: HttpClient,
    public sanitizer: DomSanitizer
) { 
    super('TwcCustomComponent', hostElement, contentPageService);
  }

  ngOnInit(): void {
    // call the wrapper init method
    this.initWrapper(this.data);
    this.initScripts();
  }

  initScripts() {
    const path = this.widgetData.Data.Url;
    const input = this.widgetData.Data.ExternalScripts;
    this.loadCustomScripts(input);

    this.http.get('https://dicedev.tetherfi.cloud/pom-poc-app/',{responseType:'text'}).subscribe(res=>{
      this.myTemplate = this.sanitizer.bypassSecurityTrustHtml(res);
    })
  }

  loadCustomScripts(urls) {
    urls.forEach(url => {
      let script;
      switch(url.type) {
        case 'script': script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url.link;
        break;
        case 'css': script = document.createElement('link');
        script.rel = 'stylesheet';
        script.href = url.link;
      }
      
      document.getElementsByTagName('head')[0].appendChild(script);
    });
    
  }

  /**
     * On refresh event
     */
   onRefreshEvent(): void {
    const urlRef = this.url;
    this.url = null;
    this.loaded = false;
    setTimeout(
        (x) => {
            this.url = x;
        },
        0,
        urlRef
    );
}

}
