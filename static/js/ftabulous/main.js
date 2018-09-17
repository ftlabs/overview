//use strict 
var main = document.getElementById('main');
var facetBtns = document.getElementsByName('select');
var genresFilter = document.getElementById('genresFilter');
var articleFilter = document.getElementById('articleFilter');
var articleStatsFilter = document.getElementById('articleStatsFilter');
var relatedStatsFilter = document.getElementById('relatedStatsFilter');
var data = null;
var table = null;
var facet = null;
var filters = ['News', 'Feature', 'Opinion'];


function init(dataStr){
	data = prepData(dataStr);

	addListeners();
	generateTable();
}

function prepData(data){
	return JSON.parse(this.formatStr(data));
}

function formatStr(str){
	return str.replace(/&quot;&gt;/g, '>')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&');
}

function addListeners(){
	facetBtns.forEach(btn => {
		btn.addEventListener('click', facetClickHandler);
	});

	genresFilter.addEventListener('click', genresFilterClickHandler);
	articleFilter.addEventListener('click', articleFilterClickHandler);
	articleStatsFilter.addEventListener('click', articleStatsFilterClickHandler);
	relatedStatsFilter.addEventListener('click', relatedStatsFilterClickHandler);
}

function facetClickHandler(e){
	undisable(facetBtns);
	e.target.disabled = true;
	facet = e.target.value;
	showHideRows();
}

function undisable(items){
	items.forEach(item => {
		item.disabled = false;
	});
}

function showHideRows(){
	table.childNodes.forEach(child => {
		if(facet === "all" 
			|| child.classList.contains('header') 
			|| child.classList.contains(facet) 
			|| !datasetCheck(filters.genres, child.dataset.genres)
		){
			child.classList.remove('hidden');
		} else {
			child.classList.add('hidden');
		}
	});
}

function datasetCheck(haystack, needles){
	if(typeof(haystack) == 'object' && typeof(needles) == 'string' && haystack.length > 0){
		var arr = needles.split('|');
		return arr.some(function (v) {
	        return haystack.indexOf(v) >= 0;
	    });
	}
	return false;
}

function genresFilterClickHandler(e){
	if(!e.target.checked){
		filters.genres = ['News', 'Feature', 'Opinion']; 
	} else {
		filters.genres = [];
	}
	showHideRows();
}

function articleFilterClickHandler(e){
	showHideTypes('articles');
}

function articleStatsFilterClickHandler(e){
	showHideTypes('articleStats');
}

function relatedStatsFilterClickHandler(e){
	showHideTypes('releatedStats');
}

function showHideTypes(className){
	var elements = document.getElementsByClassName(className);
	var show = false;

	if(elements[0].classList.contains('hidden')){
		show = true;
	}

	for(var i = 0; i < elements.length; i++){
		if(show){
			elements[i].classList.remove('hidden');
		} else {
			elements[i].classList.add('hidden');
		}
	}
}

function generateTable(){
	table = document.createElement('table');
	table.appendChild(generateTableHeader());

	data.breakdown.forEach(item => {
		table.appendChild(generateDataRow(item));
	});

	main.appendChild(table);
}

function generateTableHeader(){
	var tr = document.createElement('tr');
	tr.classList.add('header');

	var headings = [
		{name: "Pulse line", classes: ""},
		{name: "Name", classes: ""},
		{name: "Facet", classes: ""},
		{name: "Article count", classes: "articleStats"},
		{name: "Articles", value: "", classes: "articles"},
		{name: "Topic count", classes: "articleStats"},
		{name: "Related Topics", classes: "releatedStats"},
		{name: "People count", classes: "articleStats"},
		{name: "Related People", classes: "releatedStats"},
		{name: "Organisation count", classes: "articleStats"},
		{name: "Related Organisations", classes: "releatedStats"},
		{name: "Genre count", classes: "articleStats"},
		{name: "Related Genres", classes: "releatedStats"},
	];

	headings.forEach(header => {
		var th = document.createElement('th');
		th.innerHTML = header.name;
		th.className = header.classes;
		tr.appendChild(th);
	});

	return tr;
}

function generateDataRow(item){
	var tr = document.createElement('tr');
	tr.classList.add(item.facet);

	var genres = getNames(item.relatedGenreCount);
	tr.setAttribute('data-genres', genres);

	var content = [
		{name: "pulseLine", value: "", classes: ""},
		{name: "facetName", value: item.facetName, classes: ""},
		{name: "facet", value: item.facet, classes: ""},
		{name: "articleCount", value: item.articleCount, classes: "articleStats"},
		{name: "articles", value: articleListing(item.articles), classes: "articles"},
		{name: "relatedTopicCount", value: item.relatedTopicCount.length, classes: "articleStats"},
		{name: "relatedTopic", value: facetListing(item.relatedTopicCount), classes: "releatedStats"},
		{name: "relatedPeopleCount", value: item.relatedPeopleCount.length, classes: "articleStats"},
		{name: "relatedPeople", value: facetListing(item.relatedPeopleCount), classes: "releatedStats"},
		{name: "relatedOrgsCount", value: item.relatedOrgsCount.length, classes: "articleStats"},
		{name: "relatedOrgs", value: facetListing(item.relatedOrgsCount), classes: "releatedStats"},
		{name: "relatedGenreCount", value: item.relatedGenreCount.length, classes: "articleStats"},
		{name: "relatedGenre", value: facetListing(item.relatedGenreCount), classes: "releatedStats"},
	];

	content.forEach(col => {
		var td = document.createElement('td');
		td.innerHTML = col.value;
		td.className = col.classes;
		tr.appendChild(td);
	});

	return tr;
}

function articleListing(articles){
	var str = "<ul>";
	if(articles.length > 0 ){
		articles.forEach(article => {
			str += '<li><a href="' +  article.location.uri + '">' + article.title.title + '</a></li>';
		});
	}
	str +=  "</ul>";
	return str;
}

function facetListing(facets){
	var str = "<ul>";
	if(facets.length > 0 ){
		facets.forEach(facet => {
			str += '<li>' + facet.name + '</a></li>';
		});
	}
	str +=  "</ul>";
	return str;
}

function getNames(arr){
	var str = '';
	arr.forEach(item => {
		if(!str.includes(item.name)){
			str += item.name + '|';
		}
	});
	return str.substring(0, str.length - 1);
}