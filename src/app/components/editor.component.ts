import {Component, computed, ElementRef, Inject, input, output, PLATFORM_ID, viewChild} from '@angular/core';
import {Settings} from '../domains/settings.domain';
import {isPlatformBrowser, JsonPipe, NgClass} from '@angular/common';
import Prism from "prismjs";
import "prismjs/plugins/autoloader/prism-autoloader";

@Component({
  standalone: true,
  selector: '[appEditor]',
  imports: [
    JsonPipe,
    NgClass
  ],
  template: `
    <pre>{{ settings() | json }}</pre>
    <pre [ngClass]="classes()"><code [ngClass]="'language-' + settings()?.language"
                                     (input)="sourcesChanged.emit()"
                                     contenteditable="true"
                                     #sources></code></pre>
  `
})
export class EditorComponent {
  readonly settings = input<Settings>();
  readonly sourcesChanged = output<void>({alias: 'sources'});

  protected readonly classes = computed(() => [
    ...this.settings()?.lineNumbers ? 'line-numbers' : '',
    `language-${this.settings()?.language}`,
  ]);
  protected readonly sourcesRef = viewChild<ElementRef<HTMLElement>>('sources');

  constructor(@Inject(PLATFORM_ID) private readonly platformId: Object) {
    if (isPlatformBrowser(platformId)) Prism.plugins['autoloader'].languages_path = '/prismjs/components/';
  }

  highlight(preserveSelection = false) {
    if (isPlatformBrowser(this.platformId)) {
      const target = this.sourcesRef()?.nativeElement!;
      const selection = preserveSelection
        ? this.#getSelection(target.parentElement!)
        : undefined;
      target.replaceChildren(target.textContent!);
      Prism.highlightElement(target);
      selection && this.#setSelection(target.parentElement!, selection);
    }
  }

  #setSelection(parent: HTMLElement, {start = 0, end = 0}) {
    const {node: startNode, offset: startOffset} = this.#findNodeAndOffset(parent, start);
    const {node: endNode, offset: endOffset} = this.#findNodeAndOffset(parent, end);
    const range = document.createRange();

    if (startNode && endNode) {
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      const selection = getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  #getSelection(parent: HTMLElement): Record<'start' | 'end', number> | void {
    const selection = getSelection();
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0);
      return {
        end: this.#getTextOffset(parent, range.endContainer, range.endOffset),
        start: this.#getTextOffset(parent, range.startContainer, range.startOffset),
      };
    }
  }

  #getTextOffset(root: Node, target: Node, offset: number) {
    let WALKER = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), total = 0, isLast = false;
    while (root = WALKER.nextNode()!) {
      total += ((isLast = root === target) ? offset : (root as Text).length);
      if (isLast) break;
    }
    return total
  }

  #findNodeAndOffset(root: Node, targetOffset: number): { node?: Node, offset: number } {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let offset = 0, length: number;

    while (root = walker.nextNode()!) {
      ({length} = (root as Text));
      if (offset + length >= targetOffset) {
        return {
          node: root,
          offset: targetOffset - offset
        };
      }
      offset += length;
    }

    return {offset: 0};
  }
}
