//use strict 

var data = null;
var facetBtns = document.getElementsByName('select');


function init(dataStr){
	data = dataStr;

	initControls();
	addListeners();
}

function addListeners(){
	facetBtns.forEach(btn => {
		btn.addEventListener('click', facetClicked)
	});
}

function initControls(){
}

function facetClicked(e){
	console.log(e.target.value);
}


function showFacetData(){

}

