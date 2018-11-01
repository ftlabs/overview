//use strict 
var main = document.getElementById('main');
var data = null;
var facetHistory = null;

function init(dataStr, historyStr){
	data = dataStr;
	facetHistory = historyStr;

	addListeners();
	start();
}

function addListeners(){

}

function start(){
	createRow();
}

function createRow(){
	
}

function variabliseStr(str){
	return str.replace(/ /g, '').replace(/-/g, '').replace(/&/g, '').toLowerCase()
}