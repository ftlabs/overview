//use strict 
var main = document.getElementsByTagName('main')[0];
var data = null;
var facetHistory = null;

function init(dataStr, historyStr){
	data = prepData(dataStr);
	facetHistory = prepData(historyStr);

	addListeners();
	start();
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
}

function start(){
	var topTen = topFacets(5, 'people', data.breakdown);
	console.log(topTen);
	
}

function topFacets(limit, facet, facetData){
	var top = [];
	for (let i = 0; i < facetData.length; i++) {
		if(facetData[i].facet === facet){
			top.push(facetData[i]);
		}
		if(top.length >= limit){
			break;
		}
	}
	return top;
}
