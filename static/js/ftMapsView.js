var map;
var dataObj = {};
var articles = [];
var countryCodes = [];
var continentCodes = [];

function getArticleList() {
    fetch('/ftMaps/articleList')
    .then(function(res) {
        return res.text();
    })
    .then(function(res) {
        articles = JSON.parse(res)
    })
    .then(loadCodes)
    .then(translateCodes)
    .then(buildMap);
}

function buildMap() {
    return map = new Datamap({
        scope: 'world',
        element: document.getElementById('mapContainer'),
        projection: 'mercator',
        geographyConfig: {
            highlightBorderColor: '#F5F5F5',
            highlightBorderWidth: 2,
            highlightFillColor: function(geo) {
                return geo['fillColor'] || '#666666';
            },
            popupTemplate: function(geo, data) {
                if (!data) return;
                return ['<div class="hoverinfo">',
                '<strong>', geo.properties.name, '</strong>',
                '<br>Articles: <strong>', data.numberOfThings, '</strong>',
                '</div>'].join('');
            }
        },
        height: 600,
        width: 800,
        fills: {
            defaultFill: '#666666'
        },
    
        data: dataObj,
    })
    console.log(map.options.data)
}

function loadCodes() {
    return fetch('/ftMaps/countryCodes')
    .then(function(res) {
        return res.text();
    })
    .then(function(res) {
        countryCodes = JSON.parse(res)
    }).then(function(res) {
        return fetch('/ftMaps/continentCodes')
    }).then(function(res) {
        return res.text();
    })
    .then(function(res) {
        continentCodes = JSON.parse(res)
    })
}

function translateCodes() {
    var arrayOfCodes = []
    var onlyValues = []

    for(var article of articles) {
        foundContinent = continentCodes.find(function (element) {
            // if(element.name.includes(article.region)) console.log("Continent found: " + article.region + " -- as: " + element.name)
            return article.region == element.name
        })

        if(foundContinent) {
            for(var country of foundContinent.alpha) {
                arrayOfCodes.push(country);
            }
        } else {
            foundCountry = countryCodes.find(function (element) {
                // if(element.name.includes(article.region)) console.log("Region found: " + article.region + " -- as: " + element.name)
                return element.name.includes(article.region)
            })
            if(foundCountry) {
                arrayOfCodes.push(foundCountry.alpha)
            } else {
                console.log("Region not found: " + article.region)
            }
        }
    }

    arrayOfCodes.forEach(function(code) {
        dataObj[code] = {
            numberOfThings: dataObj[code] ? dataObj[code].numberOfThings + 1 : 1,
        }
    });

    for(var code in dataObj) {
        onlyValues.push(dataObj[code].numberOfThings)
    }

    var minValue = Math.min.apply(null, onlyValues),
        maxValue = Math.max.apply(null, onlyValues);
    var paletteScale = d3.scale.linear()
            .domain([minValue, maxValue])
            .range(['#052F33', '#1AECFF']);
    
    for(var code in dataObj) {
        dataObj[code].fillColor = paletteScale(dataObj[code].numberOfThings)
    }

    console.log(dataObj)

    return arrayOfCodes;
}

getArticleList();
