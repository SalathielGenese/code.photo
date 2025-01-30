import {APP_BASE_HREF} from '@angular/common';
import {CommonEngine, isMainModule} from '@angular/ssr/node';
import express from 'express';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import bootstrap from './main.server';
import {L10nService} from './app/services/l10n.service';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();
const commonEngine = new CommonEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.get(
  '**',
  express.static(browserDistFolder, {
    maxAge: '1h',
    index: 'index.html'
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get('**', (req, res, next) => {
  const {protocol, originalUrl, baseUrl, headers} = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{provide: APP_BASE_HREF, useValue: baseUrl}],
    })
    .then((html) => {
      // NOTE: Document language
      const [, language] = html.match(/meta name="language" content="([^"]+)"/) ?? [];
      res.header('Content-Language', L10nService.LANGUAGES.find(({meta}) => language === meta)?.tag);
      return res.send(html);
    })
    .catch((err) => next(err));
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const {HOST = 'localhost', PORT = 4000} = process.env;
  const server = app.listen(+PORT, HOST, () =>
    console.error(`Node Express server listening at http://${HOST}:${PORT}`));
  process.on('SIGTERM', () => server.close());
  process.on('SIGINT', () => server.close());
}
