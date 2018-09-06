let readingListStorage = document.getElementById('readingListStorage');

let readingList = [];

function addListeners() {
    document.getElementById('deleteReadingList').addEventListener('click', function() {
        readingList = [];
        localStorage.removeItem('readingList')
        getReadingList();
    })
}

function getReadingList() {
    localReadingList = localStorage.getItem('readingList')
    if(localReadingList && localReadingList.length > 0) {
        readingList = JSON.parse(localReadingList)
    } else {
        readingListStorage.innerHTML = `<p>Nothing has been added to the reading list.</p>`
    }
}

function buildReadingList() {
    if(!readingList) break;

    let newHtml = '';

    for(let article of readingList) {
        newHtmlTitle = `<p>Title: ${article.title}</p>`
        newHtmlImage = `<a href="${article.link}" title="${article.title}" target="_blank"><img src="${article.url}"></img></a>`
        newHtmlAuthor = article.author ? `<p>Author: ${article.author}</p>` : `<p>Unknown Author</p>`

        newHtml = newHtml + newHtmlTitle + newHtmlImage + newHtmlAuthor + `</br>`;
    }
    readingListStorage.innerHTML = newHtml;
}

addListeners();
getReadingList();
buildReadingList();
