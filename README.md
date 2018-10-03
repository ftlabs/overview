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
+ [FT Rainbow Maps]()
+ [FTabulous]()


## Endpoints

---

### /24hrs/daysOfArticles

*Returns the last 24 hours of published articles*

**Params**

+ ***days*** (integer) *default = 1*, although can return multiple days worth of news if you increase that number

**Response**

Returns a json reponse with a array of articles, similar to a SAPI request

[/24hrs/daysOfArticles?days=1](http://localhost:8000/24hrs/daysOfArticles?days=1)

```
[
  {
    "aspectSet": "article",
    "modelVersion": "1",
    "id": "19afc8be-c5b4-11e8-8167-bea19d5dd52e",
    ...
	},
	...
	{
		"aspectSet": "article",
    "modelVersion": "1",
    "id": "c9f02364-c612-11e8-8167-bea19d5dd52e",
    ...
	}
]
```

---

### /facetHistory/:facet

*Get the mention count for individual facet items reaching back for the given time period, results are broken down by time period*

**Params**

+ **period** [minutes|days|hours] *default = 'days'*
+ **interval** (integer) *default = 1*
+ **numInterval** (integer) *default = 5*
+ **maxFacets** (integer) *default = 100*


**Example response**

[/facetHistory/topics?period=days&interval=1&numInterval=5&maxFacets=2](http://localhost:8000/facetHistory/topics?period=days&interval=1&numInterval=5&maxFacets=2)

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

[/facetsWithArticles/relatedContent/?days=1&facet=topics&aspects=title,summary,images](http://localhost:8000/facetsWithArticles/relatedContent/?days=1&facet=topics&aspects=title,summary,images)

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

## Other apis to investigate

+ UPP (credential request required)
+ Curated list
+ Reading time
+ Fast Charts


## Other display ideas

+ Hyperbolic geometry


