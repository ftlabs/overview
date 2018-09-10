var readingList = [];
var bannedList = [];

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
    document.getElementById('superlike').addEventListener('click', function() {
        window.open(getFirstCurrentArticle().link);
        addToList('reading');
        setCurrentDate();
    })
    document.getElementById('like').addEventListener('click', function() {
        addToList('reading');
    });
    document.getElementById('dislike').addEventListener('click', function() {
        addToList('banned');
    });
    document.getElementById('readingList').addEventListener('click', function() {
        window.open('/tinder/myType');
    });
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
}

function removeFirstCurrentArticle(){
    currentArticleObject = getCurrentArticles();
    currentArticleObject.shift();
    sessionStorage.setItem('currentArticles', JSON.stringify(currentArticleObject));
}

function setCurrentDate() {
    document.getElementById('articleTitle').innerHTML = getFirstCurrentArticle().title;
    document.getElementById('articleImage').innerHTML = '<img src="' + getFirstCurrentArticle().url + '">';
    document.getElementById('articleAuthor').innerHTML = getFirstCurrentArticle().author || 'Unknown Author';
}

setCurrentArticles();
