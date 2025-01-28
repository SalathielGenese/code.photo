import {Component, effect, ElementRef, input, viewChild} from '@angular/core';
import {Settings} from '../domains/settings.domain';
import {JsonPipe} from '@angular/common';

@Component({
  standalone: true,
  selector: '[appEditor]',
  imports: [
    JsonPipe
  ],
  template: `
    <pre>{{ settings() | json }}</pre>
    <pre><code contenteditable="true" #code></code></pre>
  `
})
export class EditorComponent {
  readonly settings = input<Settings>();

  protected readonly codeViewChild = viewChild<ElementRef<HTMLElement>>('code');
}
