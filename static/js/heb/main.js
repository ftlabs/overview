//use strict 

var topicsRefresh = document.getElementById('topicsRefresh');
var peopleRefresh = document.getElementById('peopleRefresh');
var organisationsRefresh = document.getElementById('organisationsRefresh');
var selectList = document.getElementById('itemList');
var sequencer = document.getElementById('sequencer');
var speedOptions = document.getElementsByName('speed');
var activeSequencer = false;
var sequencerInterval = null;
var sequencerCurrent = 0;
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
	var items = hebd.getItems();
	for(var i = 0; i <= items.length; i++){
		selectList.appendChild( new Option(items[i], items[i]) );
	}
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
		nodeLinkHighlight(e.target.value);
	});

	sequencer.addEventListener('change', toggleSequencer, false);

	for (var i = 0; i < speedOptions.length; i++) {
	    speedOptions[i].addEventListener('change', toggleSpeed, false);
	}
}

function resetNodes(){
	for (var i = 0; i < nodes.length; i++) {
	    nodes[i].classList.remove('selected');
	}

	for (var j = 0; j < links.length; j++) {
	    links[j].classList.remove('linked--target');
	}
}

function nodeLinkHighlight(selected){
	resetNodes();
	if(selected !== ""){
		var item = document.getElementById(selected);
		if(item){
			item.classList.add('selected');
			hebd.link
	      		.classed("linked--target", function(l) {
	      			if (l.target.data.key === selected){
	      				l.source.source = true;
	      				return true;
	      			}
	      		})
	      		.filter(function(l) { return l.target.data.key === selected || l.source.data.key === selected; })
	      		.raise();

		}
	}
}

function reloadPage(facet){
	window.location.href = '/hierarchicalEdgeBundling/' + facet;
}

function drawDiagram(){
	hebd.draw();
}

function toggleSequencer(){
	var speed = 1000;

	for(var i = 0; i <= speedOptions.length; i++){
		if(speedOptions[i].checked){
			speed = speedOptions[i].value;
		}
		break;
	}

	setSequencer(speed);
}

function toggleSpeed(e){
	if(activeSequencer){
		resetNodes();
		clearInterval(sequencerInterval);
		sequencerInterval = setInterval(tickSequence, e.target.value);
	}
}

function setSequencer(speed){
	if(!activeSequencer){
		sequencerInterval = setInterval(tickSequence, speed);
		activeSequencer = true;
	} else {
		clearInterval(sequencerInterval);
		activeSequencer = false;
		resetNodes();
	}
}

function tickSequence(){
	var items = hebd.getItems();
	var nextItem = items[sequencerCurrent];
	nodeLinkHighlight(nextItem);

	sequencerCurrent++;

	if(sequencerCurrent >= items.length){
		sequencerCurrent = 0;
	}
}

