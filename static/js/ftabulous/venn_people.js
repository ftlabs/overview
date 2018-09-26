//use strict 
var main = document.getElementsByTagName('main')[0];
var data = null;
var facetHistory = null;

function init(dataStr, historyStr){
	data = prepData(dataStr);
	facetHistory = prepData(historyStr);
	start(data);
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

function start(datum){
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

	draw(collection.sub);
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

function draw(data){
	data.forEach(d => {
		let ctr = document.createElement('div');
		ctr.className = "person";
		ctr.innerHTML = d.name;

		let list = document.createElement('ul');

		d.people.forEach(rp => {
			let item = document.createElement('li');
			item.innerHTML = rp.facetName;
			list.appendChild(item);
		});

		ctr.appendChild(list);
		main.appendChild(ctr);
	});
}


function drawDiagram(col){
	var sets = prepareSets(col);
/*
	sets = [
		{sets:["Audio"], figure: 8.91, label: "Audio", size: 8.91},
		{sets:["Direct Buy"], figure: 34.53, label: "Direct Buy", size: 34.53},
		{sets:["Branded Takeover"], figure: 40.9, label: "Branded Takeover", size: 40.9},
		{sets: ["Audio", "Direct Buy"], figure: 5.05, label: "", size: 5.05},
		{sets: ["Audio", "Branded Takeover"], figure: 3.65, label: "", size: 3.65},
		{sets: ["Direct Buy", "Branded Takeover"], figure: 4.08, label: "", size: 4.08},
		{sets: ["Audio", "Direct Buy", "Branded Takeover"], figure: 2.8, label: "", size: 2.8}
		];

	console.log(sets);
	*/

	var chart = venn.VennDiagram()
		.width(window.innerWidth - 100)
		.height(500);
	
	var div = d3.select("#venn_one").datum(sets).call(chart);
		div.selectAll("text").style("fill", "white");
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
			size: countRelated(person.relatedPeopleCount)
		});

		//related people
		person.relatedPeopleCount.forEach(rpc => {
			//single
			result.push({
				sets:[rpc.name],
				label: "",
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
