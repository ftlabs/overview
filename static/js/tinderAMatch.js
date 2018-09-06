let readingList = [];
let bannedList = [];

async function setCurrentArticles() {
    await fetch('/tinder/articleList')
    .then(function(res) {
        return res.text()
    })
    .then(function(res) {
        filteredArticleList = filterArticles(res)
        sessionStorage.setItem('currentArticles', filteredArticleList)
    })
    setCurrentDate();
}

function filterArticles(articleList) {
    articleList = JSON.parse(articleList)
    
    // TODO: filter out banned + reading lists from the article list before saving
    
    return JSON.stringify(articleList)
}

function addListeners() {
    document.getElementById('superlike').addEventListener('click', function() {
        window.open(getFirstCurrentArticle().link);
        addToReadingList();
        setCurrentDate();
    })
    document.getElementById('like').addEventListener('click', function() {
        addToReadingList();
    });
    document.getElementById('dislike').addEventListener('click', function() {
        addToBannedList();
    });
    document.getElementById('readingList').addEventListener('click', function() {
        window.open('/tinder/myType')
    });
}

function getReadingAndBannedLists() {
    localReadingList = localStorage.getItem('readingList')
    localBannedList = localStorage.getItem('bannedList')
    if(localReadingList) readingList = JSON.parse(localReadingList)
    if(localBannedList) bannedList = JSON.parse(localBannedList)
}

function getCurrentArticles() {
    return JSON.parse(sessionStorage.getItem('currentArticles'))
}

function getFirstCurrentArticle() {
    return getCurrentArticles()[0]
}

function addToReadingList() {
    readingList.push(getFirstCurrentArticle());
    removeFirstCurrentArticle();
    setCurrentDate();
    localStorage.setItem('readingList', JSON.stringify(readingList));
}

function addToBannedList() {
    bannedList.push(getFirstCurrentArticle());
    removeFirstCurrentArticle();
    setCurrentDate();
    localStorage.setItem('bannedList', JSON.stringify(bannedList));
}

function removeFirstCurrentArticle(){
    currentArticleObject = getCurrentArticles()
    currentArticleObject.shift()
    sessionStorage.setItem('currentArticles', JSON.stringify(currentArticleObject))
}

function setCurrentDate() {
    document.getElementById('articleTitle').innerHTML = getFirstCurrentArticle().title;
    document.getElementById('articleImage').setAttribute("src", getFirstCurrentArticle().url);
    document.getElementById('articleAuthor').innerHTML = getFirstCurrentArticle().author || 'Unknown Author'
}

getReadingAndBannedLists();
setCurrentArticles();
addListeners();
