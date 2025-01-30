import {Component, ElementRef, input} from '@angular/core';
import html2canvas from "html2canvas";
import {FormsModule} from '@angular/forms';
import {L10nPipe} from '../pipes/l10n.pipe';
import { faCopy, faDownload } from '@fortawesome/free-solid-svg-icons';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';

@Component({
  standalone: true,
  selector: '[appActions]',
  imports: [L10nPipe, FormsModule, FaIconComponent],
  template: `
    <label class="leading-none px-3 py-2 ml-2">
      <input [(ngModel)]="exports.transparent"
             class="hidden peer"
             type="checkbox"
      >
      <span class="after:translate-x-[2px] after:-translate-y-1/2 after:bg-stone-500/90 after:aspect-square after:content-[''] after:absolute after:-left-5 after:top-1/2 after:h-3
                   before:-translate-y-1/2 before:aspect-square before:content-[''] before:absolute before:-left-5 before:border-1 before:top-1/2 before:h-4
                   peer-not-checked:before:opacity-10 peer-not-checked:after:opacity-40
                   before:transition-all after:transition-all
                   relative"
      >
        {{ 'exports.transparent' | l10n }}
      </span>
    </label>
    <button class="leading-none px-3 py-2"
            [title]="'action.copy' | l10n"
            (click)="exportToClipboard()"
    >
      <fa-icon [icon]="icons.faCopy"/>
    </button>
    <button [title]="'action.download' | l10n"
            class="leading-none px-3 py-2"
            (click)="exportForDownload()"
    >
      <fa-icon [icon]="icons.faDownload"/>
    </button>
  `
})
export class ActionsComponent {
  readonly sourcesViewRef = input.required<ElementRef<HTMLElement>>();

  protected readonly exports: {
    transparent?: boolean;
  } = {};
  protected readonly icons = {
    faDownload,
    faCopy,
  } as const;

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
