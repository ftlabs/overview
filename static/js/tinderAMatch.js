var readingList = [];
var bannedList = [];
var Hammer = new Hammer(document, {
    recognizers: [
        [Hammer.Swipe,{ direction: Hammer.DIRECTION_ALL }],
        [Hammer.Tap, { event: 'doubletap', taps: 2 }]
    ]
});

var infoPanel;
// Hammer.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });

function setCurrentArticles() {
    getReadingAndBannedLists();
    fetch('/tinder/articleList')
    .then(function(res) {
        return res.text();
    })
    .then(function(res) {
        filteredArticleList = filterArticles(res);
        sessionStorage.setItem('currentArticles', filteredArticleList);
    })
    .then(setCurrentDate)
    .then(addListeners);
}

function filterArticles(articleList) {
    articleList = JSON.parse(articleList);
    // TODO: filter out banned + reading lists from the article list before saving
    return JSON.stringify(articleList);
}

function addListeners() {
    infoPanel = document.querySelector('.infoPanel');
    document.getElementById('readingList').addEventListener('click', function() {
        window.open('/tinder/myType');
    });

    Hammer.on('doubletap', function(e) {
        window.open(getFirstCurrentArticle().link);
        addToList('reading');
        setCurrentDate();
    });

    Hammer.on('swipeleft', function(e) {
        addToList('banned');
    });

    Hammer.on('swiperight', function(e) {
        addToList('reading');
    });

    Hammer.on('swipeup', function(e){
        toggleInfo('show');
    });

    Hammer.on('swipedown', function(e){
        toggleInfo('hide');
    });
}

function toggleInfo(state) {
    if(state === 'show') {
        infoPanel.classList.remove('panel-hidden');
    }  else if(state === 'hide') {
        infoPanel.classList.add('panel-hidden');
    }
}

function getReadingAndBannedLists() {
    localReadingList = localStorage.getItem('readingList');
    localBannedList = localStorage.getItem('bannedList');
    if(localReadingList) readingList = JSON.parse(localReadingList);
    if(localBannedList) bannedList = JSON.parse(localBannedList);
}

function getCurrentArticles() {
    return JSON.parse(sessionStorage.getItem('currentArticles'));
}

function getFirstCurrentArticle() {
    return getCurrentArticles()[0];
}

function addToList(type) {
    if(type === 'reading') {
        readingList.push(getFirstCurrentArticle());
        localStorage.setItem('readingList', JSON.stringify(readingList));
    } else if(type === 'banned') {
        bannedList.push(getFirstCurrentArticle());
        localStorage.setItem('bannedList', JSON.stringify(bannedList));
    }
    removeFirstCurrentArticle();
    setCurrentDate();
    toggleInfo('hide');
}

function removeFirstCurrentArticle(){
    currentArticleObject = getCurrentArticles();
    currentArticleObject.shift();
    sessionStorage.setItem('currentArticles', JSON.stringify(currentArticleObject));
}

function setCurrentDate() {
    document.getElementById('articleTitle').innerHTML = getFirstCurrentArticle().title;
    document.getElementById('articleImage').style.backgroundImage = "url(" + getFirstCurrentArticle().url + ")";
    document.getElementById('articleAuthor').innerHTML = getFirstCurrentArticle().author || 'Unknown Author';
}

setCurrentArticles();
