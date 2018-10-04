//use strict 
var diagramCtn = document.getElementById('venn');
var numSlider = document.getElementById('rangeInput');
var sliderCount = document.getElementById('currentRangeCount');
var data = null;
var numFacets = 5;
var maxLength = 25;

function init(dataStr, historyStr){
	data = prepData(dataStr);

	//disabled because the diagram cannot (currently) handle drawing all possible people
	//updateSlider();

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

function updateSlider(){
	var max = data.breakdown.length;

	if(max > maxLength){
		max = maxLength;
	}

	numSlider.setAttribute('max', max);
}

function addListeners(){
	window.addEventListener('resize', redrawDiagram);
	numSlider.addEventListener('change', sliderChange);
}

function sliderChange(e){
	numFacets = e.target.value;
	sliderCount.value = e.target.value;
	redrawDiagram()
}

function redrawDiagram(){
	removeDiagram();
	//add loading gif
	start();
}

function removeDiagram(){
	diagramCtn.innerHTML = "";
}

function start(){
	var collection = {
		main : topFacets(numFacets, 'people', data.breakdown),
		sub: []
	};

	collection.main.forEach(person => {
		let relatedPeople = {
			name: person.facetName,
			people: []
		};
		person.relatedPeopleCount.forEach(related => {
			relatedPeople.people.push(getByName(related.name, data.breakdown)[0]);
		});
		collection.sub.push(relatedPeople);
	});

	drawDiagram(collection);
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

function getByName(name, facetData){
	return result = facetData.filter(obj => {
		return obj.facetName === name;
	});
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

function log10min(num){
	return (Math.log10(num) > 0) ? Math.log10(num) : 0.1;
}

function countRelated(related, figure = 0.1){
	related.forEach(rp => {
		figure += rp.count;
	});
	return Number(figure);
}
