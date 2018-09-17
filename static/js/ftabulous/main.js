//use strict 
var main = document.getElementById('main');
var facetBtns = document.getElementsByName('select');
var genresFilter = document.getElementById('genresFilter');
var articleStatsFilter = document.getElementById('articleStatsFilter');
var data = null;
var table = null;
var filters = [];

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

	articleStatsFilter.addEventListener('click',articleStatsFilterClickHandler);
}

function facetClickHandler(e){
	undisable(facetBtns);
	e.target.disabled = true;
	showHideRows(e.target.value);
}

function undisable(items){
	items.forEach(item => {
		item.disabled = false;
	});
}

function showHideRows(facet){
	table.childNodes.forEach(child => {
		if(facet === "all" || child.classList.contains('header') || child.classList.contains(facet)){
			child.classList.remove('hidden');
		} else {
			child.classList.add('hidden');
		}
	});
}

function genresFilterClickHandler(e){
	if(e.target.checked){
		filters.genres = ['News', 'Feature', 'Opinion'];
	} else {
		filters.genres = [];
	}
}

function articleStatsFilterClickHandler(){
	toggleShowHide('articleStats');
}

function toggleShowHide(className){
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
		{name: "Name", classes: ""},
		{name: "Facet", classes: ""},
		{name: "Article Count", classes: "articleStats"},
		{name: "Topic count", classes: "articleStats"},
		{name: "People count", classes: "articleStats"},
		{name: "Organisation count", classes: "articleStats"},
		{name: "Genre count", classes: "articleStats"},
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
	tr.setAttribute('data', "genres: " + genres);

	var content = [
		{name: "facetName", value: item.facetName, classes: ""},
		{name: "facet", value: item.facet, classes: ""},
		{name: "articleCount", value: item.articleCount, classes: "articleStats"},
		{name: "relatedTopicCount", value: item.relatedTopicCount.length, classes: "articleStats"},
		{name: "relatedPeopleCount", value: item.relatedPeopleCount.length, classes: "articleStats"},
		{name: "relatedOrgsCount", value: item.relatedOrgsCount.length, classes: "articleStats"},
		{name: "relatedGenreCount", value: item.relatedGenreCount.length, classes: "articleStats"},
	];

	content.forEach(col => {
		var td = document.createElement('td');
		td.innerHTML = col.value;
		td.className = col.classes;
		tr.appendChild(td);
	});

	return tr;
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