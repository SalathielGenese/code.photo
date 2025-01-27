import {Component, DestroyRef, effect, model, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {L10nPipe} from '../pipes/l10n.pipe';
import {Settings} from '../domains/settings.domain';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {filter} from 'rxjs';

@Component({
  standalone: true,
  selector: '[appSettings]',
  template: `
    <form [formGroup]="form">
      <label>
        <input type="text" formControlName="language" list="languages">
        <span>{{ 'settings.programming-language' | l10n }}</span>
        <datalist id="languages">
          @for (language of languages; track language) {
            <option [value]="language">{{ language }}</option>
          }
        </datalist>
      </label>
    </form>
  `,
  imports: [
    ReactiveFormsModule,
    L10nPipe,
  ],
})
export class SettingsComponent implements OnInit {
  readonly settings = model<Settings>();

  protected readonly languages = 'java,javascript,php,rust,python,dart,kotlin,html'.split(',');
  protected form!: FormGroup<{
    language: FormControl<string | null>;
  }>;

  constructor(private readonly fb: FormBuilder,
              private readonly destroyRef: DestroyRef) {
    effect(() => {
      if (this.#sortedJson(this.settings()) !== this.#sortedJson(this.form.value)) {
        this.form.setValue({...this.form.value, ...this.settings() as Required<Settings> ?? {}});
      }
    });
  }

  ngOnInit() {
    this.form = this.fb.group({
      language: this.fb.control('java', [
        Validators.required,
        ({value: _}) => !_ || this.languages.includes(_) ? null : {invalid: true},
      ]),
    });
    this.form.valueChanges
      .pipe(filter(() => this.form.valid))
      .pipe(filter(_ => this.#sortedJson(_) !== this.#sortedJson(this.settings())))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.settings.set(value));
  }

  #sortedJson(value: object = {}) {
    return JSON.stringify(value, Object.keys(value).sort());
  }
}
