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
		collection.sub[person.facetName] = [];
		person.relatedPeopleCount.forEach(related => {
			collection.sub[person.facetName].push(getByName(related.name, data.breakdown)[0]);
		});
	});

	//faux face API 
	

	console.log(collection);
	draw(collection);
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

function draw(col){
	drawParent(col)
}

function drawParent(col){

}
