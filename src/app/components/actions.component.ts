import {Component, ElementRef, input} from '@angular/core';
import html2canvas from "html2canvas";
import {FormsModule} from '@angular/forms';
import {L10nPipe} from '../pipes/l10n.pipe';

@Component({
  standalone: true,
  selector: '[appActions]',
  imports: [L10nPipe, FormsModule],
  template: `
    <label>
      <input [(ngModel)]="exports.transparent"
             type="checkbox">
      <span>{{ 'exports.transparent' | l10n }}</span>
    </label>
    <button (click)="exportToClipboard()">
      {{ 'action.copy' | l10n }}
    </button>
    <button (click)="exportForDownload()">
      {{ 'action.download' | l10n }}
    </button>
  `
})
export class ActionsComponent {
  readonly sourcesViewRef = input.required<ElementRef<HTMLElement>>();

  protected readonly exports: {
    transparent?: boolean;
  } = {};

  protected async exportToClipboard() {
    const canvas = await this.#exporting();
    const item = await new Promise<ClipboardItem>((succeed, fail) =>
      canvas.toBlob(blob => blob
        ? succeed(new ClipboardItem({'image/png': blob}))
        : fail(blob)));
    void navigator.clipboard.write([item]);
  }

  protected async exportForDownload() {
    const canvas = await this.#exporting();
    Object.assign(document.createElement('a'), {
      href: canvas.toDataURL('image/png'),
      download: 'code.photo.png',
    }).click()
  }

  async #exporting() {
    const {transparent} = this.exports;
    const target = this.sourcesViewRef().nativeElement.parentElement?.parentElement!;
    console.log(target)
    if (transparent) (target.style.backgroundColor = 'transparent');
    const canvas = await html2canvas(target, {backgroundColor: null});
    if (transparent) target.removeAttribute('style');
    return canvas;
  }
}
