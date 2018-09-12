//use strict 

var facetOptions = document.getElementsByName('facetSelect');

var filterList = document.getElementById('filterList');
var highlightList = document.getElementById('highlightList');

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
	setLinks();
	setNodes();
}

function generateList(){
	while (filterList.firstChild) {
	    filterList.removeChild(filterList.firstChild);
	}

	var items = hebd.getItems();
	filterList.appendChild( new Option("--", "") );

	for(var i = 0; i <= items.length; i++){
		if(items[i] !== undefined){
			var itemSplit = items[i].split('.');
			var shortname = itemSplit[itemSplit.length - 1];
			filterList.appendChild( new Option(shortname, items[i]) );
		}
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

	highlightList.addEventListener('change', function(e){
		//nodeLinkHighlight(e.target.value);
	});

	filterList.addEventListener('change', function(e){
		nodeFilters(e.target.value);
	});

	sequencer.addEventListener('change', toggleSequencer, false);

	for (var j = 0; j < speedOptions.length; j++) {
	    speedOptions[j].addEventListener('change', toggleSpeed, false);
	}

	for (var i = 0; i < facetOptions.length; i++) {
	    facetOptions[i].addEventListener('change', redrawDiagram, false);
	}
}

function redrawDiagram(){
	hebd.removeDiagram();
	drawDiagram();
	generateList();
}

function resetNodes(){
	for (var i = 0; i < nodes.length; i++) {
	    nodes[i].classList.remove('selected');
	    nodes[i].classList.remove('noded--source');
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

			hebd.node
				.each(function(n) { n.target = n.source = false; });

			hebd.link
	      		.classed("linked--target", function(l) {
	      			if (l.target.data.key === selected){
	      				l.source.source = true;
	      				return true;
	      			}
	      		})
	      		.filter(function(l) { return l.target.data.key === selected || l.source.data.key === selected; })
	      		.raise();

	      	hebd.node
		      .classed("noded--source", function(n) { return n.source; });
		}
	}
}

function nodeFilters(selected){
	resetNodes();
	hebd.removeDiagram();
	hebd.draw( getSelectedFacets(), selected );
}

function drawDiagram(filter = null){
	hebd.draw( getSelectedFacets() );
	generateList();
}

function getSelectedFacets(){
	var selected = [];
	var checkboxes = document.getElementsByName('facetSelect');
	checkboxes.forEach(box => {
		if(box.checked){
			selected.push(box.value);
		}
	});
	return selected;
}

/*
 * Sequencer functions
 */
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