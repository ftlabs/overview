//use strict 
var main = document.getElementsByTagName('main')[0];
var data = null;
var facetHistory = null;

function init(dataStr, historyStr){
	data = dataStr;
	facetHistory = historyStr;
	start(data);
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
