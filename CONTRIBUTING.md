# globalping.io Contributing Guide

Hi! We're really excited that you're interested in contributing! Before submitting your contribution, please read through the following guide.

## Overview

The website uses [Ractive.js](https://ractive.js.org/), [ractive-route](https://github.com/MartinKolarik/ractive-route), and a custom build of [Bootstrap v3](https://getbootstrap.com/). To add a new page, you need to create a new `.html` in [views/pages](https://github.com/jsdelivr/globalping.io/tree/master/src/views/pages) (use one of the existing ones as a reference), and add it to [client-side routing](https://github.com/jsdelivr/globalping.io/blob/master/src/public/js/app.js). All `.html` files are compiled as [Ractive.js components](https://ractive.js.org/api/#component-files). Styles are in a separate [less directory](https://github.com/jsdelivr/globalping.io/tree/master/src/public/less), which mirrors the `views` structure.

### Guidelines

-   Bug fixes and changes discussed in the existing issues are always welcome.
-   For new ideas, please open an issue to discuss them before sending a PR.
-   Make sure your PR passes `npm test` and has [appropriate commit messages](https://github.com/jsdelivr/globalping.io/commits/master).

## Repo Setup

To get started, you need to have Node.js with NPM installed. Then run the following commands:

```bash
npm install

# to start the website
npm start
```

In development, the website uses local services (see `config/development.js`):

-   [Globalping API](https://github.com/jsdelivr/globalping) at `http://localhost:3000`
-   [Globalping Dashboard Directus](https://github.com/jsdelivr/globalping-dash-directus) at `http://localhost:18055`

To start the website without them, use the production services:

```bash
SERVER_API_HOST=https://api.globalping.io SERVER_API_DOCS_HOST=https://api.globalping.io SERVER_DASHBOARD_HOST=https://dash-directus.globalping.io npm start
```

Sign-in does not work on localhost with the production services, because the session cookie is set with `SameSite=Strict`. To test the website as a signed-in user, set the production cookie `dash_session_token` (`.globalping.io`) to `SameSite=None` in the browser devtools.

Configuration for IntelliJ based IDEs is also available in this repository. If you use one, it is a good idea to add https://github.com/MartinKolarik/idea-config as a [read-only settings repository](https://www.jetbrains.com/help/idea/sharing-your-ide-settings.html#share-more-settings-through-read-only-repo). It contains code style and inspection profiles used by this project.

## Testing

-   JS, HTML, and JSON code style: `npm run lint:js`
-   CSS code style: `npm run lint:css`
-   e2e tests: `npm run test:e2e`
-   All combined: `npm test`

Most IDEs have plugins integrating the used linters (eslint, stylelint), including support for automated fixes on save.

## Production config

```js
module.exports = {
	server: {
		port: "SERVER_PORT", // defaults to 13000
	},
};
```

Additionally, `ELASTIC_APM_SERVER_URL`, `ELASTIC_APM_SECRET_TOKEN`, `ELASTIC_SEARCH_URL` (including user + pass), `NODE_ENV=production`, and `GLOBALPING_LOGO_DEV_PUBLIC_TOKEN` should be set.
