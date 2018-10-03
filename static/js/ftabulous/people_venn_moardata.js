//use strict 
var diagramCtn = document.getElementById('venn_one');
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
	window.addEventListener('resize', redrawDiagram);
}

function redrawDiagram(){
	removeDiagram();
	start();
}

function removeDiagram(){
	diagramCtn.innerHTML = "";
}

function start(){
	var collection = {
		main : topFacets(5, 'people', data.breakdown),
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
		.height(window.innerHeight - 100);
	
	var div = d3.select("#venn_one").datum(sets).call(chart);
		div.selectAll("text").style("fill", "white").style("font-size", "1.5vw");
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
			label: `${person.facetName}, Article count: ${person.articleCount}`,
			size: countRelated(person.relatedPeopleCount)
		});

		//related people
		person.relatedPeopleCount.forEach(rpc => {
			//single
			result.push({
				sets:[rpc.name],
				label: `${rpc.name}, Occurrences: ${rpc.count}`,
				size: Number(rpc.count)
			});

			//combined
			result.push({
				sets:[rpc.name, person.facetName],
				label: '',
				//size: Number(rpc.count)
				size: 0.5
			});
			
		});
	});
	return result;
}

function countRelated(related, figure = 0){
	related.forEach(rp => {
		figure += rp.count;
	});
	return Number(figure);
}
