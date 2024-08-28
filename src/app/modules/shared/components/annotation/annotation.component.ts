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

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.annotateCanvas = document.getElementById('anotateCanvas-' + this.sessionID);
    setTimeout(() => { }, 200);
    this.annotateCtx = this.annotateCanvas.getContext('2d');
    this.cdr.detectChanges();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.setCanvasSize(true);
  }

  setCanvasSize(isResize?: boolean) {
    // const image = document.getElementById('imageToAnnotate-' + this.sessionID);

    const img = new Image();
    img.src = this.sourceImage;


    this.annotateCanvas.width = img?.width * window.devicePixelRatio;
    this.annotateCanvas.height = img?.height * window.devicePixelRatio;

    this.annotateCanvas.style.width = `${img?.width}px`;
    this.annotateCanvas.style.height = `${img?.height}px`;

    this.annotateCtx = this.annotateCanvas.getContext('2d');
    this.annotateCtx.mozImageSmoothingEnabled = false;
    this.annotateCtx.webkitImageSmoothingEnabled = false;
    this.annotateCtx.msImageSmoothingEnabled = false;
    this.annotateCtx.imageSmoothingEnabled = false;
    this.annotateCtx.imageSmoothingQuality = 'high'
    this.annotateCtx.drawImage(
      img, 0, 0,
      img.width * window.devicePixelRatio,
      img.height * window.devicePixelRatio
    );

    if (!isResize) {
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
      this.annotateCtx.clearRect(0, 0, this.annotateCanvas.width, this.annotateCanvas.height);
      this.annotateCtx.putImageData(this.canvasCtxDataArray[this.canvasCtxDataArrayIndex], 0, 0);
      this.annotateCtx.lineWidth = this.annotatePenStrokeWidth;
      this.annotateCtx.strokeStyle = this.annotatePenColor;
      this.annotateCtx.strokeRect(
        this.rectStartPosX,
        this.rectStartPosY,
        posX - this.rectStartPosX,
        posY - this.rectStartPosY
      );
    } else if (this.activeTool == 'circle') {
      this.annotateCtx.clearRect(0, 0, this.annotateCanvas.width, this.annotateCanvas.height);
      this.annotateCtx.putImageData(this.canvasCtxDataArray[this.canvasCtxDataArrayIndex], 0, 0);
      this.annotateCtx.lineWidth = this.annotatePenStrokeWidth;
      this.annotateCtx.strokeStyle = this.annotatePenColor;
      this.annotateCtx.beginPath();
      this.annotateCtx.arc(this.rectStartPosX, this.rectStartPosY, Math.abs(posX - this.rectStartPosX), 0, 2 * Math.PI);
      this.annotateCtx.stroke();
      this.annotateCtx.closePath();
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

  async onDoneAnnotate(isSubmit) {
    if (isSubmit) {
      const base64 = this.annotateCanvas.toDataURL();

      this.annotateCanvas.toBlob((blob) => {
        let file = new File([blob], `image_${new Date().getTime()}.png`, { type: "image/png" });
        file['base64'] = base64;
        this.annotatedImage.emit(file);
      }, 'image/png');

    } else {
      this.annotatedImage.emit(false);
    }

  }
}
