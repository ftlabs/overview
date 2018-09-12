var map;
var dataObj = {};
var articles = [];
var countryCodes = [];

function getArticleList() {
    fetch('/ftMaps/articleList')
    .then(function(res) {
        return res.text();
    })
    .then(function(res) {
        articles = JSON.parse(res)
    })
    .then(loadCountryCodes)
    .then(translateCountryCodes)
    .then(buildMap)
}

function buildMap() {
    return map = new Datamap({
        scope: 'world',
        element: document.getElementById('mapContainer'),
        projection: 'mercator',
        geographyConfig: {
            highlightOnHover: false,
        },
        height: 600,
        width: 800,
        fills: {
            'MAJOR': '#306596',
            'MEDIUM': '#0fa0fa',
            'MINOR': '#bada55',
            defaultFill: '#666666'
        },
    
        data: dataObj,
    })
    console.log(map.options.data)
}

function loadCountryCodes() {
    return fetch('/ftMaps/countryCodes')
    .then(function(res) {
        return res.text();
    })
    .then(function(res) {
        countryCodes = JSON.parse(res)
    })
}

function translateCountryCodes() {
    var arrayOfCodes = []
    for(var article of articles) {
        found = countryCodes.find(function (element) {
            return element.name.includes(article.region)
        })
        if(found) {
            arrayOfCodes.push(found.alpha)
        } else {
            console.log("Region not found: " + article.region)
        }
    }

    arrayOfCodes.forEach(function(code) {
        dataObj[code] = {
            fillKey: dataObj[code] ? 'MAJOR' : 'MINOR',
            numberOfThings: dataObj[code] ? dataObj[code].numberOfThings + 1 : 1,
        }
    });

    console.log(arrayOfCodes)

    return arrayOfCodes;
}

getArticleList();
