import {Component, ElementRef, input} from '@angular/core';

@Component({
  standalone: true,
  selector: '[appActions]',
  template: `
    <button>
      COPY
    </button>
    <button>
      DOWNLOAD
    </button>
  `
})
export class ActionsComponent {
  readonly sourcesViewRef = input.required<ElementRef<HTMLElement>>();
}
