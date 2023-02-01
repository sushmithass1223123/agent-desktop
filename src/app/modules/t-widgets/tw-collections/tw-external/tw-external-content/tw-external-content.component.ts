import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'tw-external-content',
  templateUrl: './tw-external-content.component.html',
  styleUrls: ['./tw-external-content.component.css']
})
export class TwExternalContentComponent implements OnInit {
  myTemplate;
  constructor(public http: HttpClient,
    public sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    
   

  }

}
