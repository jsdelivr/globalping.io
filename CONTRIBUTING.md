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

Configuration for IntelliJ based IDEs is also available in this repository. If you use one, it is a good idea to add https://github.com/MartinKolarik/idea-config as a [read-only settings repository](https://www.jetbrains.com/help/idea/sharing-your-ide-settings.html#share-more-settings-through-read-only-repo). It contains code style and inspection profiles used by this project.

### Network (ISP) pages

These pages use data from external APIs to display logos. If the required API keys are not set,
the pages work, but the logos don't load. Set the following to work on those pages:

1. `ipInfoToken` (`GLOBALPING_IP_INFO_TOKEN`) - get it for free [here](https://ipinfo.io/signup)
2. `logoDevPublicToken` (`GLOBALPING_LOGO_DEV_PUBLIC_TOKEN`) - get it for free [here](https://www.logo.dev/signup)

## Testing

-   JS code style: `npm run lint:js`
-   CSS code style: `npm run lint:css`
-   Integration tests: `npm run mocha`
-   All combined: `npm test`

Most IDEs have plugins integrating the used linters (eslint, stylelint), including support for automated fixes on save.

## Production config

```js
module.exports = {
	server: {
		port: "SERVER_PORT", // defaults to 4400
	},
};
```

Additionally, `ELASTIC_APM_SERVER_URL`, `ELASTIC_APM_SECRET_TOKEN`, `ELASTIC_SEARCH_URL` (including user + pass), `NODE_ENV=production`, `GLOBALPING_IP_INFO_TOKEN` and `GLOBALPING_LOGO_DEV_PUBLIC_TOKEN` should be set.
