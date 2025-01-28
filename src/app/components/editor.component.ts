import {Component, computed, effect, ElementRef, Inject, input, PLATFORM_ID, viewChild} from '@angular/core';
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
                                     (input)="editing=true; highlight()"
                                     contenteditable="true"
                                     #code></code></pre>
  `
})
export class EditorComponent {
  readonly settings = input<Settings>();

  protected editing = false;
  protected readonly classes = computed(() => [
    `language-${this.settings()?.language}`
  ]);
  protected readonly codeViewChild = viewChild<ElementRef<HTMLElement>>('code');

  readonly #plugin = '/prismjs/plugins/%/prism-%.min';

  constructor(@Inject(PLATFORM_ID) private readonly platformId: Object) {
    const theme = computed(() => this.settings()?.theme);
    isPlatformBrowser(platformId) && effect(onCleanup => {
      // TODO: Try leveraging SSR metadata when the URL contains the language details
      onCleanup(() => document.querySelector(`link[href^="/prismjs/themes/prism"]`)?.remove());
      document.head.appendChild(Object.assign(document.createElement('link'), {
        href: `/prismjs/themes/prism${theme() ? `-${theme()}` : ''}.min.css`,
        rel: 'stylesheet',
      }));
    });
  }

  protected highlight() {
    if (isPlatformBrowser(this.platformId)) {
      const target = this.codeViewChild()?.nativeElement!;
      const selection = this.editing
        ? this.#getSelection(target.parentElement!)
        : undefined;
      target.replaceChildren(target.textContent!);
      Prism.highlightElement(target);
      selection && this.#setSelection(target.parentElement!, selection);
    }
    this.editing = false;
  }

  #setSelection(parent: HTMLElement, {start = 0, end = 0}) {
    // Find the position in the DOM tree
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
