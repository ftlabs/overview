let readingListStorage = document.getElementById('readingListStorage');

let readingList = [];

function getReadingList() {
    localReadingList = localStorage.getItem('readingList')
    if(localReadingList) {
        readingList = JSON.parse(localReadingList)
    } else {
        readingListStorage.innerHTML = `<p>Nothing has been added to the reading list.</p>`
    }
}

function buildReadingList() {
    if(!readingList) return;

    let newHtml = '';

    for(let article of readingList) {
        newHtmlTitle = `<p>Title: ${article.title}</p>`
        newHtmlImage = `<a href="${article.link}" title="${article.title}" target="_blank"><img src="${article.url}"></img></a>`
        newHtmlAuthor = article.author ? `<p>Author: ${article.author}</p>` : `<p>Unknown Author</p>`

        newHtml = newHtml + newHtmlTitle + newHtmlImage + newHtmlAuthor + `</br>`;
    }
    readingListStorage.innerHTML = newHtml;
}

getReadingList();
buildReadingList();
