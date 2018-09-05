let superlikeButton = document.getElementById('superlike');
let likeButton = document.getElementById('like');
let dislikeButton = document.getElementById('dislike');
let readingListButton = document.getElementById('readingList');
let datingButton = document.getElementById('dating');

let readingList = [];
let bannedList = [];

function setCurrentArticles() {
    fetch('/tinder/articleList')
    .then(function(res) {
        return res.text()
    })
    .then(function(res) {
        filteredArticleList = filterArticles(res)
        sessionStorage.setItem('currentArticles', filteredArticleList)
    })
}

function filterArticles(articleList) {
    articleList = JSON.parse(articleList)
    
    // TODO: filter out banned + reading lists from the article list before saving
    
    return JSON.stringify(articleList)
}

function addListeners() {
    superlikeButton.addEventListener('click', function() {
        window.open(getFirstCurrentArticle().link);
        addToReadingList();
        setCurrentDate();
    })
    likeButton.addEventListener('click', function() {
        addToReadingList();
    });
    dislikeButton.addEventListener('click', function() {
        addToBannedList();
    });
    readingListButton.addEventListener('click', function() {
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
setCurrentDate();
addListeners();
