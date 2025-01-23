# Code Photo

Highlight code, export to image.
Make presentations, documents and whatnot!

## Stack

+ Angular v19
+ `pnpm` for package management
+ Helm for application deployment
+ GitHub actions for continuous delivery

## Deployment

When bumping version, sync:

+ `./package.json`
+ `./deployment/helm/Chart.yaml #version`
+ `./deployment/helm/Chart.yaml #appVersion`

Two distinct pipeline:

+ `Release`:
  + build production-ready assets,
  + publish TAR ball as GitHub release
+ `Deploy`:
  + containerize the TAG ball
  + push Docker image to GitHub container registry
  + update the application, using Helm chart under `./deployment/helm/`

> The idea here is that whenever GitHub expires a release/package, rebuilding
> and redeploying will be superfast. But Deploy can be executed independently
> of Release.

## Contribution

```bash
# Install dependencies
pnpm install

# Start a local development server
pnpm start

# Build the project: add `--configuration=production` for production build
pnpm build

# Execute unit tests with the [Karma](https://karma-runner.github.io) test runner
pnpm test

# For end-to-end (e2e) testing
pnpm ng e2e
```

# License

TODO
