import {Component, ElementRef, input} from '@angular/core';
import html2canvas from "html2canvas";

@Component({
  standalone: true,
  selector: '[appActions]',
  template: `
    <button (click)="exportToClipboard()">
      COPY
    </button>
    <button (click)="exportForDownload()">
      DOWNLOAD
    </button>
  `
})
export class ActionsComponent {
  readonly sourcesViewRef = input.required<ElementRef<HTMLElement>>();

  protected exportToClipboard() {
    const target = this.sourcesViewRef().nativeElement.parentElement!;

    html2canvas(target as HTMLElement, {backgroundColor: null})
      .then(canvas => new Promise<ClipboardItem>((succeed, fail) => canvas.toBlob(blob =>
        blob
          ? succeed(new ClipboardItem({'image/png': blob}))
          : fail(blob))))
      .then(item => navigator.clipboard.write([item]));
  }

  protected exportForDownload() {
    const target = this.sourcesViewRef().nativeElement.parentElement!;

    html2canvas(target as HTMLElement, {backgroundColor: null})
      .then(canvas => canvas.toDataURL('image/png'))
      .then(href => Object.assign(document.createElement('a'), {
        download: 'code.photo.png',
        href,
      }).click());
  }

}
