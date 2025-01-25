import {Component, DestroyRef, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';

@Component({
  selector: '[appHomePage]',
  template: `
    <nav>
      <a routerLink="/">None</a>
      -
      <a routerLink="/en">English</a>
      -
      <a routerLink="/fr">Francais</a>
    </nav>
    Home... '{{ lang }}'
  `,
  imports: [
    RouterLink
  ]
})
export class HomeComponent implements OnInit {
  protected lang?: string;

  constructor(private readonly router: Router,
              private readonly destroyRef: DestroyRef,
              private readonly activatedRoute: ActivatedRoute,) {
  }

  ngOnInit() {
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
    const subscription = this.activatedRoute.params.subscribe(({language}) => {
      if (language) this.lang = language;
      else void this.router.navigate([this.#language], {
        relativeTo: null,
      })
    });
  }

  get #language() {
    // TODO: resolve language
    return 'en';
  }
}
