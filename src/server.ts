import {APP_BASE_HREF} from '@angular/common';
import {CommonEngine, isMainModule} from '@angular/ssr/node';
import express from 'express';
import {createSecureServer} from 'node:http2';
import {readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import bootstrap from './main.server';

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
    maxAge: '1y',
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
    .then((html) => res.send(html))
    .catch((err) => next(err));
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const {
    SERVER_CERTIFICATE_PATH,
    HOST = 'localhost',
    SERVER_KEY_PATH,
    PORT = 4000,
  } = process.env;
  const server = (SERVER_CERTIFICATE_PATH || SERVER_KEY_PATH)
    ? createSecureServer({
      key: readFileSync(SERVER_KEY_PATH!),
      cert: readFileSync(SERVER_CERTIFICATE_PATH!),
    }, (req, res) => app(req as any, res as any))
    : app;
  const handle = server.listen(+PORT, HOST, () => {
    const protocol = `http${(SERVER_CERTIFICATE_PATH || SERVER_KEY_PATH) ? 's' : ''}`;
    console.error(`Node Express server listening on ${protocol}://${HOST}:${PORT}`);
  });
  process.on('SIGTERM', () => handle.close());
  process.on('SIGINT', () => handle.close());
}
