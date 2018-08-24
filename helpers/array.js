'use strict';

function unique(arrays){
	return ( [ ...new Set( [].concat(...arrays) ) ] );
}

function uniqueCount(array){
	let count = [];
	array.forEach(item => {
		let varItem = count.find(function (obj) { return obj.name === item; });
		if(varItem === undefined){
			count.push({ name: item, count: 1 });
		} else {
			varItem.count =  varItem.count + 1;
		}
	});
	return count;
}

function sortArray(array, sortable) {
    return array.sort(function(obj1, obj2){
    	return obj2[sortable] - obj1[sortable];
    });
}

function uniqueSort(arr, sortable){
	return sortArray(uniqueCount(arr), sortable);
}


module.exports = {
	unique,
	uniqueCount,
	sortArray,
	uniqueSort
};
