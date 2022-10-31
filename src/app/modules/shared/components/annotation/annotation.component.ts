import { ChangeDetectorRef, Component, HostListener, Input, OnInit, Output, EventEmitter, AfterViewInit } from '@angular/core';

declare var document: any;
@Component({
  selector: 'app-annotation',
  templateUrl: './annotation.component.html',
  styleUrls: ['./annotation.component.scss']
})
export class AnnotationComponent implements OnInit, AfterViewInit {

  @Input() sourceImage!: string;
  @Input() sessionID;
  isPenActive: boolean = false;
  annotateCanvas!: HTMLCanvasElement | any;
  annotateCtx!: CanvasRenderingContext2D | any;
  annotatePenColor: string = '#000';
  annotatePenStrokeWidth: number = 2;
  activeTool: string = 'pen';
  showPenControls: boolean = false;
  canvasCtxDataArray: any = [];
  canvasCtxDataArrayIndex = -1;
  rectStartPosX!: number;
  rectStartPosY!: number;
  isRectPenTouched: boolean = false;
  isCirclePenTouched: boolean = false;
  showShapeControls: boolean = false;
  @Output() annotatedImage = new EventEmitter(); 

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.annotateCanvas = document.getElementById('anotateCanvas-'+this.sessionID);
    setTimeout(() => {}, 200);
    this.annotateCtx = this.annotateCanvas.getContext('2d');
    this.cdr.detectChanges();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    //this.setCanvasSize(true);
  }

  setCanvasSize(isResize?: boolean) {
    this.annotateCanvas.width = document.getElementById('imageToAnnotate-'+this.sessionID)?.clientWidth;
    this.annotateCanvas.height = document.getElementById('imageToAnnotate-'+this.sessionID)?.clientHeight;
    this.annotateCtx.drawImage(document.getElementById('imageToAnnotate-'+this.sessionID), 0, 0, this.annotateCanvas.width, this.annotateCanvas.height)
    this.annotateCtx.scale(3,3);
    
    if(!isResize){
      this.canvasCtxDataArray.push(
        this.annotateCtx.getImageData(0, 0, this.annotateCanvas.width, this.annotateCanvas.height)
      );
      this.canvasCtxDataArrayIndex += 1;
    }
  }

  setPenActive(event: any) {
    this.isPenActive = true;
    if (this.activeTool != 'pen') {
      let r = this.annotateCanvas.getBoundingClientRect();
      if (event.offsetX) this.rectStartPosX = event.offsetX;
      else this.rectStartPosX = event.touches[0].clientX - r.left;
      if (event.offsetY) this.rectStartPosY = event.offsetY;
      else this.rectStartPosY = event.touches[0].clientY - r.top;
    }
    this.freeDraw(event);
  }

  setPenInactive() {
    if (this.isPenActive) {
      this.isPenActive = false;
      this.annotateCtx.beginPath();
      this.canvasCtxDataArray.push(
        this.annotateCtx.getImageData(0, 0, this.annotateCanvas.width, this.annotateCanvas.height)
      );
      this.canvasCtxDataArrayIndex += 1;
    }
  }

  setPenStrokeWidth(width: number) {
    this.annotatePenStrokeWidth = width;
    setTimeout(() => {
      this.showPenControls = false;
    }, 50);
  }

  freeDraw(event: any) {
    if (!this.isPenActive) return;
    let posX;
    let posY;
    let r = this.annotateCanvas.getBoundingClientRect();
    if (event.offsetX) posX = event.offsetX;
    else posX = event.touches[0].clientX - r.left;
    if (event.offsetY) posY = event.offsetY;
    else posY = event.touches[0].clientY - r.top;
    this.annotateCtx.lineWidth = this.annotatePenStrokeWidth;
    this.annotateCtx.lineCap = 'round';
    this.annotateCtx.strokeStyle = this.annotatePenColor;
    if (this.activeTool == 'pen') {
      this.annotateCtx.lineTo(posX, posY);
      this.annotateCtx.stroke();
      this.annotateCtx.beginPath();
      this.annotateCtx.moveTo(posX, posY);
      this.isRectPenTouched = false;
      this.isCirclePenTouched = false;
    } else if (this.activeTool == 'rect') {
      if (this.isRectPenTouched) this.undoCanvas();
      this.annotateCtx.rect(
        this.rectStartPosX,
        this.rectStartPosY,
        posX - this.rectStartPosX,
        posY - this.rectStartPosY
      );
      this.annotateCtx.stroke();
      this.canvasCtxDataArray.push(
        this.annotateCtx.getImageData(0, 0, this.annotateCanvas.width, this.annotateCanvas.height)
      );
      this.canvasCtxDataArrayIndex += 1;
      this.annotateCtx.beginPath();
      this.isRectPenTouched = true;
    } else if (this.activeTool == 'circle') {
      if (this.isCirclePenTouched) this.undoCanvas();
      this.annotateCtx.arc(this.rectStartPosX, this.rectStartPosY, Math.abs(posX - this.rectStartPosX), 0, 2 * Math.PI);
      this.annotateCtx.stroke();
      this.canvasCtxDataArray.push(
        this.annotateCtx.getImageData(0, 0, this.annotateCanvas.width, this.annotateCanvas.height)
      );
      this.canvasCtxDataArrayIndex += 1;
      this.annotateCtx.beginPath();
      this.isCirclePenTouched = true;
    }
  }

  clearCanvas() {
    this.annotateCtx.clearRect(0, 0, this.annotateCanvas.width, this.annotateCanvas.height);
    this.canvasCtxDataArray = [];
    this.canvasCtxDataArrayIndex = -1;
    this.setCanvasSize();
  }

  undoCanvas() {
    if (this.canvasCtxDataArrayIndex <= 0) this.clearCanvas();
    else {
      this.canvasCtxDataArrayIndex -= 1;
      this.canvasCtxDataArray.pop();
      this.annotateCtx.putImageData(this.canvasCtxDataArray[this.canvasCtxDataArrayIndex], 0, 0);
    }
  }

  async onDoneAnnotate (isSubmit){
    if(isSubmit) {
      const base64 = this.annotateCanvas.toDataURL();
      const res: Response = await fetch(base64);
      this.annotatedImage.emit(res.url);
    } else {
      this.annotatedImage.emit(false);
    }
    
  }
}
