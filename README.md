# Overview

An exploration/investigation of providing an overview of the news from the last 24 hours.


## Setup

### Credentials

You will need to create a .env file and include the mandatory environment variables, which are:

```
CAPI_KEY= # you can request this via the FT developer portal
LANTERN_API_KEY= # you can request this via slack.
TOKEN= # for authorised access without S3O or IP range. This can be set to a noddy value for development.
PORT= # Set port to 3001 to allow correct OKTA authentication
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

## Demo pages

All demos are listed on the home page ('/') when running the project **and/or** you can view them on the Heroku test link.

+ [Home page](https://ftlabs-overview.herokuapp.com/)
+ [24 hours or articles](https://ftlabs-overview.herokuapp.com/24hrs)
+ [Facet history](https://ftlabs-overview.herokuapp.com/facetHistory)
+ [Lanturn Data](https://ftlabs-overview.herokuapp.com/lantern)
+ [Content list data](https://ftlabs-overview.herokuapp.com/list)
+ [Timeline](https://ftlabs-overview.herokuapp.com/timeline)
+ [Facets with Articles endpoint](https://ftlabs-overview.herokuapp.com/facetsWithArticles)
+ [Heartbeat](https://ftlabs-overview.herokuapp.com/heartbeat)
+ [Hierarchical Edge Bundling](https://ftlabs-overview.herokuapp.com/hierarchicalEdgeBundling)
+ [FT as Tinder](https://ftlabs-overview.herokuapp.com/tinder)
+ [FT Rainbow Maps](https://ftlabs-overview.herokuapp.com/ftMaps)
+ [FTabulous](https://ftlabs-overview.herokuapp.com/ftabulous)
+ [searchAndContent summary](https://ftlabs-overview.herokuapp.com/searchAndContent/display/basic1)
+ [year summary](https://ftlabs-overview.herokuapp.com/year/display/basic1?year1=2017&year2=2018)


## Endpoints

More details on the endpoints created for this project. Each endpoint sits on top of existing FT API(s) and provides a custom query or view of that data.

---

### /24hrs/daysOfArticles

*Returns the last 24 hours of published articles*

**Params**

+ ***days*** (integer) *default = 1*, although can return multiple days worth of news if you increase that number

**Response**

Returns a json reponse with a array of articles, similar to a SAPI request

[/24hrs/daysOfArticles?days=1](https://ftlabs-overview.herokuapp.com/24hrs/daysOfArticles?days=1)


---

### /facetHistory/:facet

*Get the mention count for individual facet items reaching back for the given time period, results are broken down by time period*

**Params**

+ **period** [minutes|days|hours] *default = 'days'*
+ **interval** (integer) *default = 1*
+ **numInterval** (integer) *default = 5*
+ **maxFacets** (integer) *default = 100*


**Example response**

[/facetHistory/topics?period=days&interval=1&numInterval=5&maxFacets=2](https://ftlabs-overview.herokuapp.com/facetHistory/topics?period=days&interval=1&numInterval=5&maxFacets=2)

```
{
  "description": "Returns metrics for facet numbers over the time period specificed in the params of the query",
  "requestParams": {
    "facet": "topics",
    "period": "days",
    "interval": "1",
    "numInterval": "5",
    "maxFacets": "2"
  },
  "datetimeRange": {
    "start": "2018-10-02T08:55:46Z",
    "end": "2018-09-27T08:55:46Z",
    "list": []
  },
  "facets": [
    {
      "name": "Companies",
      "count": [
        50,
        43,
        8,
        31,
        60,
        60
      ]
    },
    {
      "name": "World",
      "count": [
        49,
        46,
        8,
        42,
        45,
        68
      ]
    }
  ]
}
```

---

### /facetsWithArticles/relatedContent

*Retrieve all facet items (topic, organisation, people and genere) with the articles they're tagged in and other facets items that are also in those tagged articles*

**Params**

+ **days** (integer) *default = 1*
+ **facet** (integer) *default = 'topics'*

**Example response**

[/facetsWithArticles/relatedContent/?days=1&facet=topics&aspects=title,summary,images](https://ftlabs-overview.herokuapp.com/facetsWithArticles/relatedContent/?days=1&facet=topics&aspects=title,summary,images)

```
{
  "description": "List of facets, from the last 1 days. Each returned facet item has a list of articles it features in and a list of other facets listed by those articles",
  "facetItemTotal": 377,
  "articleTotal": 1312,
  "breakdown": [
    {
      "facetName": "News",
      "articles": [
        {
          "aspectSet": "article",
          "modelVersion": "1",
          "id": "0ce372cc-c55d-11e8-bc21-54264d1c4647",
          ...
         },
         ...
      ],
      "articleCount": 85,
      "facet": "genre",
      "relatedTopicCount": [
        {
          "name": "Companies",
          "count": 15
        },
        {
          "name": "World",
          "count": 13
        },
        {
          "name": "US & Canadian companies",
          "count": 6
        },
        {
          "name": "Markets",
          "count": 5
        }
      ],
      "relatedPeopleCount": [],
      "relatedOrgsCount": [],
      "relatedGenreCount": []
    }
  ]
}
```

---

### /facetsWithArticles/articlesAggregation?days=10&timeslip=100&minCorrelation=3

*Search for all articles in a date range, extract the metadata, group by genre, look for correlations, identify candidate newsworthy topics*

**Params**

+ **days** (integer) *default = 1*
+ **facet** (comma-separated string) *default = 'topics'*
+ **timeslip** (integer) *default = 0*, number of days ago
+ **minCorrelation** (integer) *default = 1*, threshold for correlationAnalysis
+ **genres** (comma-separated string) *default = all genres*
+ **payloads** (comma-separated string) *default = all payloads*

```
{
...
aggregationsByGenre : {
  ...,
  "genre:genre:News" : {
    ...,
    correlationAnalysis : {},
    articlesByMetadataCsv : {},
    facetCorrelationsCsv: {},
    facetCorrelations: {},
    articlesByMetadataCsv: {},
    articlesByUuid: {},
  }
 }
}
```
---

### /searchAndContent - combining SAPI with followup CAPI calls

All of the following endpoints are POSTs and GETs.

The POSTs can take the standard SAPI query body (if encoded as application/json).

POSTs and GETs can support query params to override any defaults or what is set in the POST body, e.g.
* &maxResults=10
* &queryString=lastPublishDateTime:<2015-08-21T16:18:00Z

and for the \*deeper endpoints involving multiple searches
* maxDepth
* maxDurationMs

NB, each call will return with whatever data has been gathered by the time it reaches the time threshold. Since the SAPI and CAPI calls are cached, re-invoking the same call will most likely lead to further SAPI+CAPI calls and thus return a bigger dataset until the full response has been achieved.

and for doing the concertina step
* concertinaOverlapThreshold (what proportion of the smaller list needs to be in the larger list for the smaller list to be merged with the larger list)

and for splitting concertinaed lists into cliques
* min2ndCliqueCount (min size for the next smallest subset/clique)
* min2ndCliqueProportion
* max2ndCliqueProportion

which annotation groups to compute
* groups (a comma-separated list, e.g. primaryThemes,abouts (default), and mentions,aboutsAndMentions)
   * NB, including any of the mentions groups adds considerably to the processing time and data size

#### Main endpoints

* /searchAndContent/search
   * full results incl all of SAPI and all of the CAPIs
* /searchAndContent/search/deeper
   * full results of multiple searches
* /searchAndContent/search/deeper/articles
   * just the articles from multiple searches
* /searchAndContent/search/deeper/articles/capi
   * just the capi part of the articles from multiple searches

* /searchAndContent/correlateDammit
   * the main focal point of this code, including the derived correlation info
   * with additional optional params:
      * genres: which genres to include in the correlations, default="News,Opinion"
      * groups: which subsets of metadata to include in the correlations, default="primaryThemes,abouts" (also mentions, aboutsAndMentions)

#### other endpoints

* /getArticle/uuid
   * or /article?uuid=...
* /summariseFetchTimings
   * optional: ?lastFew=10

---

### /year - counting and comparing topics between years

#### endpoints

* /year/topics/:year
* /year/topics/:year1/:year2
* /year/topics/compare/:year1/:year2
* /year/topics/classify/:year1/:year2

#### display

* /year/display/basic1?year1=...&year2=...

---

## Other APIs to investigate

+ UPP (credential request required)
+ Curated list
+ Reading time
+ Fast Charts


## Other display ideas

+ Hyperbolic geometry
+ Relationship trees
