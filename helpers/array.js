'use strict';

function unique(arrays){
	return ( [ ...new Set( [].concat(...arrays) ) ] );
}

function uniqueCount(array){
	let count = {};
	for(let i = 0; i < array.length; i++){
		count[array[i]] = 1 + (count[array[i]] || 0);
	}
	return count;
}

function matching(arrays){
	return [];
}


module.exports = {
	unique,
	uniqueCount
};
