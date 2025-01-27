import {Pipe, PipeTransform} from '@angular/core';
import {L10nService} from '../service/l10n.service';

@Pipe({
  name: 'l10n',
  pure: false,
})
export class L10nPipe implements PipeTransform {
  constructor(private readonly l10nService: L10nService) {
  }

  transform(value: string) {
    return this.l10nService.cache()[value];
  }
}
