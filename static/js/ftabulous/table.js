//use strict 
var main = document.getElementById('main');
var facetBtns = document.getElementsByName('select');
//var genresFilter = document.getElementById('genresFilter');
var articleFilter = document.getElementById('articleFilter');
var articleStatsFilter = document.getElementById('articleStatsFilter');
var relatedStatsFilter = document.getElementById('relatedStatsFilter');
var pulselinesFilter = document.getElementById('pulselinesFilter');
var data = null;
var facetHistory = null;
var table = null;
var facet = null;
var filters = [];


function init(dataStr, historyStr){
	data = prepData(dataStr);
	facetHistory = prepData(historyStr);

	addListeners();
	generateTable();
	generatePulseLines();
}

function prepData(data){
	return JSON.parse(formatStr(data));
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

	//genresFilter.addEventListener('click', genresFilterClickHandler);
	articleFilter.addEventListener('click', articleFilterClickHandler);
	articleStatsFilter.addEventListener('click', articleStatsFilterClickHandler);
	relatedStatsFilter.addEventListener('click', relatedStatsFilterClickHandler);
	pulselinesFilter.addEventListener('click', pulselinesFilterClickHandler);
}

function facetClickHandler(e){
	undisable(facetBtns);
	e.target.disabled = true;
	facet = e.target.value;
	showHideRows();

	if(facet === 'all'){
		showHideTypes('facet', false, 'show');
	} else {
		showHideTypes('facet', false, 'hide');
	}
}

function undisable(items){
	items.forEach(item => {
		item.disabled = false;
	});
}

function showHideRows(){
	var rows = table.rows;

	for(var i = 0; i < rows.length; i++){
		var show = false;

		if(filters.genres && filters.genres.length > 0){
			show = filterContains(filters.genres, rows[i].dataset.genres);
		}
		if(facet === "all" 
			|| rows[i].classList.contains('header') 
			|| rows[i].classList.contains(facet)
			|| (filters.genres && filters.genres.length > 0 && filterContains(filters.genres, rows[i].dataset.genres))
		){
			show = true;
		}

		if(show){
			rows[i].classList.remove('hidden');
		} else {
			rows[i].classList.add('hidden');
		}
	}
}

function filterContains(haystack, needles){
	var check = false;

	if(haystack.length === 0){
		return true;
	}

	if(needles){
		var searchItems = needles.split('|');
		for(var i = 0; i < searchItems.length; i++){
			if(haystack.includes(searchItems[i])){
				check = true;
				break;
			}
		}
	}
	return check;
}

function genresFilterClickHandler(e){
	if(!e.target.checked){
		filters.genres = []; 
	} else {
		filters.genres = ['News', 'Feature', 'Opinion'];
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

function pulselinesFilterClickHandler(e){
	showHideTypes('pulselines');
}

function showHideTypes(className, toggle = true, state = 'hide'){
	var elements = document.getElementsByClassName(className);

	if(toggle){
		if(elements[0].classList.contains('hidden')){
			state = 'show';
		}
	}

	for(var i = 0; i < elements.length; i++){
		if(state === 'show'){
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
		{name: "Pulse line", classes: "pulselines"},
		{name: "Name", classes: ""},
		{name: "Facet", classes: "facet"},
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

	if(item.facet === "genre"){
		tr.setAttribute('data-genres', item.facetName);
	}

	var svgStr = '<svg class="' + variabliseStr(item.facetName) + '" width="400" height="100"></svg>';

	var content = [
		{name: "pulseLine", value: svgStr, classes: "pulselines"},
		{name: "facetName", value: item.facetName, classes: ""},
		{name: "facet", value: item.facet, classes: "facet"},
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

function generatePulseLines(){
	var chartList = [];
	var facets = facetHistory.facets;


	facets.forEach(facet => {
		chartList.push({
			info: prepCount(facet.logCount),
			dom: variabliseStr(facet.name)
		});
	});

	addChartsToPage(chartList);
}

function prepCount(data){
	return data.map((counter, inc) => {
		return {date: inc, close: counter};
	})
}

function addChartsToPage(list){
	list.forEach(chart => {
		createLine(chart.info, chart.dom);
	})
}

function createLine(data, domTarget){
	var target = document.getElementsByClassName(domTarget)[0];

	if(target)
	{
		var svg = d3.select(target),
		    margin = {top: 20, right: 20, bottom: 30, left: 50},
		    width = +svg.attr("width") - margin.left - margin.right,
		    height = +svg.attr("height") - margin.top - margin.bottom,
		    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var x = d3.scaleTime()
		    .rangeRound([0, width]);

		var y = d3.scaleLinear()
		    .rangeRound([height, 0]);

		var line = d3.line()
		    .x(function(d) { return x(d.date); })
		    .y(function(d) { return y(d.close); });

		x.domain(d3.extent(data, function(d) { return d.date; }));
		y.domain(d3.extent(data, function(d) { return d.close; }));

		g.append("path")
			.datum(data)
			.attr("fill", "none")
			.attr("stroke", "steelblue")
			.attr("stroke-linejoin", "round")
			.attr("stroke-linecap", "round")
			.attr("stroke-width", 1.5)
			.attr("d", line);
	}
}

function variabliseStr(str){
	return str.replace(/ /g, '').replace(/-/g, '').replace(/&/g, '').toLowerCase()
}