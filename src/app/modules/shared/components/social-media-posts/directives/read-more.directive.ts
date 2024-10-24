import { Directive, ElementRef, Renderer2, Input, AfterViewInit } from '@angular/core';

@Directive({
    selector: '[appReadMore]'
})
export class ReadMoreDirective implements AfterViewInit {
    @Input() maxLines = 3;
    @Input() readMoreText = 'Read More';
    @Input() readLessText = 'Read Less';

    private originalText: string = '';
    private isClamped = true;
    private maxRetries: number = 50;
    private readMoreButton: HTMLElement | null = null;

    constructor(private el: ElementRef, private renderer: Renderer2) {}

    ngAfterViewInit(): void {
      try {
        this.originalText = this.el.nativeElement.innerHTML.trim();
        this.validateClamping();
      } catch (error) {
        console.error(error)
      }
    }

    /**
     * Method to validate clamping
     * @param retryCount Maximum retries if element not found
     */
    private validateClamping(retryCount = 0) {
        try {
            retryCount++;
            const lineHeight = this.getLineHeight();
            const maxHeight = lineHeight * this.maxLines;

            if (this.el.nativeElement.scrollHeight > maxHeight) this.clampText();

            if (this.el.nativeElement.scrollHeight === 0 && this.originalText.length && retryCount <= this.maxRetries) {
                // If element not rendered
                setTimeout(() => {
                    this.validateClamping(retryCount);
                }, 250);
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Method to calculate line line height
     * @returns Line height
     */
    private getLineHeight(): number {
        try {
            const computedStyle = window.getComputedStyle(this.el.nativeElement);
            const lineHeight = parseFloat(computedStyle.lineHeight);

            return isNaN(lineHeight) ? parseFloat(computedStyle.fontSize) * 1.2 : lineHeight;
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Method to clamp the element
     */
    private clampText() {
        try {
            const element = this.el.nativeElement;

            this.renderer.setStyle(element, 'display', '-webkit-box');
            this.renderer.setStyle(element, '-webkit-line-clamp', this.maxLines);
            this.renderer.setStyle(element, '-webkit-box-orient', 'vertical');
            this.renderer.setStyle(element, 'overflow', 'hidden');

            this.addReadMoreButton();
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Method to unclamp the element
     * After unclamping changing read more to read less
     */
    private unclampText() {
        try {
            const element = this.el.nativeElement;

            this.renderer.setStyle(element, 'display', 'block');
            this.renderer.removeStyle(element, '-webkit-line-clamp');
            this.renderer.removeStyle(element, '-webkit-box-orient');
            this.renderer.removeStyle(element, 'overflow');

            if (this.readMoreButton) {
                this.readMoreButton.innerText = this.readLessText;
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Method to add a read mode button to parent node
     * Adds event listener to that read more button and handles clamping
     */
    private addReadMoreButton() {
        try {
            if (!this.readMoreButton) {
                this.readMoreButton = this.renderer.createElement('button');
                this.readMoreButton.classList.add('read-more');
                this.readMoreButton.innerText = this.readMoreText;

                this.renderer.setStyle(this.readMoreButton, 'cursor', 'pointer');
                this.renderer.setStyle(this.readMoreButton, 'margin-top', '10px');
                this.renderer.appendChild(this.el.nativeElement.parentNode, this.readMoreButton);

                this.renderer.listen(this.readMoreButton, 'click', () => {
                    this.isClamped = !this.isClamped;
                    if (this.isClamped) {
                        this.clampText();
                    } else {
                        this.unclampText();
                    }
                    this.readMoreButton!.innerText = this.isClamped ? this.readMoreText : this.readLessText;
                });
            }
        } catch (error) {
            console.error(error);
        }
    }
}
