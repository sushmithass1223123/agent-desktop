import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ContentPageService } from '@services/content-page.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';

@Component({
  selector: 'tw-external',
  templateUrl: './tw-external.component.html',
  styleUrls: ['./tw-external.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class TwExternalComponent extends TWidgetWrapper implements OnInit {

  @Input() data: any;
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
  super('TwcCustomComponent');
 }

 ngOnInit(): void {
   // call the wrapper init method
   this.initWrapper(this.data);
   this.initScripts();
 }

 initScripts() {
   const path = this.data.Data.Url;
   const input = this.data.Data.ExternalScripts;
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
