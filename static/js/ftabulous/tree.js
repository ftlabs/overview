//use strict 
var main = document.getElementById('main');
var data = null;
var facetHistory = null;

function init(dataStr, historyStr){
	data = prepData(dataStr);
	facetHistory = prepData(historyStr);

	addListeners();
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

function variabliseStr(str){
	return str.replace(/ /g, '').replace(/-/g, '').replace(/&/g, '').toLowerCase()
}