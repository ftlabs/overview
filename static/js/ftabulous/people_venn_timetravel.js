//use strict 
var diagramCtn = document.getElementById('venn');
var dayBtns = document.getElementsByClassName('dayBtn');
var data = null;
var numFacets = 2;
var maxLength = 25;
var currentDay = 1;
var initiated = false;

function init(dataStr, historyStr){
	data = dataStr;
	addListeners();
	start();
}

function addListeners(){
	window.addEventListener('resize', redrawDiagram);

	for(var i = 0; i < dayBtns.length; i++){
		dayBtns[i].addEventListener('click', dayBtnClickHandler);
	}
}

function dayBtnClickHandler(e){
	for(var i = 0; i < dayBtns.length; i++){
		dayBtns[i].removeAttribute('disabled');
	}

	currentDay = e.target.value.slice(-1);
	e.target.disabled = true;

	redrawDiagram();

	//updateDiagram();
}

function redrawDiagram(){
	diagramCtn.innerHTML = "";
	start();
}

function start(){
	drawDiagram(createCollection(data.days[currentDay-1].data));
}

function createCollection(data){
	return {
		main : [data],
		sub: data.relatedPeopleCount
	};
}

function updateDiagram(){
	var newData = createCollection(data.days[currentDay-1].data);
	var newDataSub = newData.sub;
	var svgCtn = document.getElementsByTagName('svg')[0];
	var currentSets = document.getElementsByTagName('g');

	for(var i = 0; i < currentSets.length; i++){

		for(var j = 0; j < newDataSub.length; j++){

			if(newDataSub[j].name === currentSets[i].dataset.vennSets){

				var pathElement = currentSets[i].getElementsByTagName('path')[0];
				var textElement = currentSets[i].getElementsByTagName('text')[0];

				pathElement.remove();
				textElement.remove();

				//animate to hidden 
				//pathElement.setAttribute('d', 'M 0 0 m 0 0 a 0 0 0 1 0 0 0 a 0 0 0 1 0 0 0');
				//delete from dom once complete


			}



		}

	}

	//get all the data sets currently in play
	//remove any sets that 



}

function drawDiagram(col){
	var sets = prepareSets(col);

	var chart = venn.VennDiagram()
		.width(window.innerWidth - 100)
		.height(window.innerHeight - 150);
	
	var div = d3.select("#venn").datum(sets).call(chart);
		div.selectAll("text").style("fill", "white").style("font-size", "1.2vw");
		div.selectAll(".venn-circle path")
				.style("fill-opacity", .8)
				.style("stroke-width", 1)
				.style("stroke-opacity", 1)
				.style("stroke", "fff");
	
	initiated = true;
}

function prepareSets(data){
	let result = [];
	data.main.forEach(person => {
		//main people
		result.push({
			sets:[person.facetName],
			label: person.facetName,
			size: person.articleCount
		});

		//related people
		person.relatedPeopleCount.forEach(rpc => {
			//single
			result.push({
				sets:[rpc.name],
				label: "",
				size: 0.2
			});

			//combined
			result.push({
				sets:[rpc.name, person.facetName],
				label: '',
				size: 0.2
			});
			
			
		});
	});
	return result;
}
