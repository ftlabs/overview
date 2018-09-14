# Overview

An exploration/investigation of providing an overview of the news from the last 24 hours.


## Setup

### Credentials

You will need to create a .env file and include the mandatory environment variables, which are:

```
CAPI_KEY= # you can request this via the FT developer portal
LANTERN_API_KEY= # you can request this via slack.
TOKEN= # for authorised access without S3O or IP range. This can be set to a noddy value for development.
PORT= # auto set in Heroku, but needs specifying for development.
LIST_IDS= # JSON object of list ids for the content list db (found in LastPass)
IMAGE_SERVICE_URL= # Image service URL
REPLACE_IMG_URL= # Replace image URL
FT_LOGO= # FT logo image to be used as a backup for articles with no images.
GOOGLE_CREDS= # *Production only* contents of keyfile.json.
```

You will also need a `keyfile.json` with credentials for big query for the list service (found in LastPass). In production this is loaded through an environment variable `GOOGLE_CREDS`.


### Installation

Install nodemon globally by running `npm install -g nodemon`.

Install the dependencies by running `npm install` and start the server with `npm start`.

For tests, run:

```sh
$ npm test
```


## Endpoints

### /24hrs/daysOfArticles

*Returns the last 24 hours of published articles*

**Params**

+ ***days*** (integer) *default = 1*, although can return multiple days worth of news if you increase that number


### /facetHistory/:facet

*Get the mention count for individual facet items reaching back for the given time period, results are broken down by time period*

**Params**

+ ***period*** [minutes|days|hours] *default = 'days'*
+ ***interval*** (integer) *default = 1*
+ ***numInterval*** (integer) *default = 5*
+ ***maxFacets*** (integer) *default = 100*


### /facetsWithArticles/relatedContent

*Retrieve all facet items (topic, organisation, people and genere) with the articles they're tagged in and other facets items that are also in those tagged articles*

**Params**

+ ***days*** (integer) *default = 1*
+ ***facet*** (integer) *default = 'topics'*


## Other apis to investigate

+ UPP (credential request required)
+ Curated list
+ Reading time


## Other display ideas

+ Hyperbolic geometry


