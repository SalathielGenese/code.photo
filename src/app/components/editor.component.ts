import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  Inject,
  input,
  model,
  output,
  PLATFORM_ID,
  viewChild
} from '@angular/core';
import {Settings} from '../domains/settings.domain';
import {isPlatformBrowser, isPlatformServer, NgClass} from '@angular/common';
import Prism from "prismjs";
import "prismjs/plugins/autoloader/prism-autoloader";

@Component({
  standalone: true,
  imports: [NgClass],
  selector: '[appEditor]',
  template: `
    <fieldset class="before:-translate-y-1/2 before:aspect-square before:rounded-full before:bg-[#EC473E] before:content-[''] before:absolute before:left-2 before:-top-3 before:z-10 before:h-3
                     after:-translate-y-1/2 after:aspect-square after:rounded-full after:bg-[#E8B600] after:content-[''] after:absolute after:left-7 after:-top-3 after:z-10 after:h-3
                     border-2 border-t-24 rounded-tl-lg rounded-tr-lg
                     relative min-w-64">
      <legend class="-translate-y-1/2 aspect-square rounded-full bg-[#00c951] absolute left-12 -top-3 z-10 h-3"></legend>
    <pre [attr.data-start]="settings()?.lineNumbersStart ?? 1"
         [attr.data-line]="settings()?.lineHighlight"
         [ngClass]="classes()"
         class="!m-0"
    ><code [ngClass]="'focus:outline-0 inline-block min-h-6 pr-2 language-' + settings()?.language"
           (input)="sourcesChange.emit(sources.textContent ?? '')"
           contenteditable="true"
           spellcheck="false"
           #sources
    ></code></pre>
    </fieldset>
  `
})
export class EditorComponent implements AfterViewInit {
  readonly settings = input<Settings>();
  readonly initialSources = input<string>();
  readonly sourcesInitialized = model(false);
  readonly sourcesChange = output<string>({alias: 'sources'});
  readonly sourcesViewRefChange = output<ElementRef<HTMLElement> | undefined>({alias: 'sourcesViewRef'});

  protected readonly classes = computed(() => [
    `language-${this.settings()?.language}`,
    ...Number.isSafeInteger(this.settings()?.lineNumbersStart) ? ['line-numbers'] : [''],
  ]);
  protected readonly sourcesViewRef = viewChild<ElementRef<HTMLElement>>('sources');

  constructor(@Inject(PLATFORM_ID) private readonly platformId: Object) {
    if (isPlatformServer(platformId)) return;
    effect(() => this.sourcesViewRefChange.emit(this.sourcesViewRef()));
    Prism.plugins['autoloader'].languages_path = '/prismjs/components/';
  }

  ngAfterViewInit() {
    const initialSources = this.initialSources();
    if (initialSources && isPlatformBrowser(this.platformId))
      this.sourcesViewRef()?.nativeElement.replaceChildren(initialSources);
    this.sourcesInitialized.set(true);
  }

  highlight(preserveSelection = false) {
    if (isPlatformBrowser(this.platformId)) {
      const target = this.sourcesViewRef()?.nativeElement!;
      const selection = preserveSelection ? this.#getSelection(target.parentElement!) : undefined;

      if (Number.isSafeInteger(this.settings()?.lineNumbersStart))
        target.querySelector('.line-numbers-rows')?.remove();
      target.querySelector('.line-highlight')?.remove();
      target.replaceChildren(target.textContent!);
      Prism.highlightElement(target);

      if (selection) this.#setSelection(target.parentElement!, selection);
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
