# Overview

An exploration/investigation of providing an overview of the news from the last 24 hours.

## Installation

You will need to create a .env file and include the mandatory environment variables, which are:

```
CAPI_KEY= # you can request this via the FT developer portal
LANTERN_API_KEY= # you can request this via slack.
TOKEN= # for authorised access without S3O or IP range. This can be set to a noddy value for development.
PORT= # auto set in Heroku, but needs specifying for development.
```

Install nodemon globally by running `npm install -g nodemon`.

Install the dependencies by running `npm install` and start the server with `npm start`.

For tests, run:

```sh
$ npm test
```

identify common topics in 24 hours
hilighting topics and people that appear in those topics (or visa versa)
pulse lines to show topic relevance, or people relevance over

storyline arcs

## other apis

latern
curated list
reading time
