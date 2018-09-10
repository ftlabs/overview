//use strict 

var topicsRefresh = document.getElementById('topicsRefresh');
var peopleRefresh = document.getElementById('peopleRefresh');
var organisationsRefresh = document.getElementById('organisationsRefresh');
var selectList = document.getElementById('itemList');
var links = [];
var nodes = [];
var hebd = null;
var data = null;

function init(dataStr){
	data = dataStr;

	initDiagram();
	initControls();
	addListeners();
	drawDiagram();
}

function initDiagram(){
	hebd = new HierarchicalEdgeBundlingDiagram();
	hebd.init(data, 'main');
}

function initControls(){
	generateList();
	setLinks();
	setNodes();
}

function generateList(){
	hebd.getItems().forEach(item => {
		selectList.appendChild( new Option(item, item) );
	});
}

function setLinks(){
	nodes = document.getElementsByTagName('text');
}

function setNodes(){
	links = document.getElementsByTagName('path');
}

function addListeners(){
	window.addEventListener('resize', function(){
		hebd.refreshDiagram();
	});

	topicsRefresh.addEventListener('click', function(){
		reloadPage('topics');
	});

	peopleRefresh.addEventListener('click', function(){
		reloadPage('people');
	});

	organisationsRefresh.addEventListener('click', function(){
		reloadPage('organisations');
	});

	selectList.addEventListener('change', function(e){
		resetNodes();

		var selected = e.target.value;

		if(selected !== ""){
			var item = document.getElementById(selected);
			if(item){
				item.classList.add('selected');

				hebd.link
		      		.classed("linked--target", function(l) {
		      			if (l.target.data.key === selected){
		      				return l.source.source = true;
		      			}
		      		});
			}
		}
	});
}

function resetNodes(){
	for (var i = 0; i < nodes.length; i++) {
	    nodes[i].classList.remove('selected');
	}

	for (var i = 0; i < links.length; i++) {
	    links[i].classList.remove('linked--target');
	}

}

function reloadPage(facet){
	window.location.href = '/hierarchicalEdgeBundling/' + facet;
}

function drawDiagram(){
	hebd.draw();
}

