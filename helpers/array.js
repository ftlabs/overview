'use strict';

function unique(arrays){
	return ( [ ...new Set( [].concat(...arrays) ) ] );
}

function matching(arrays){
	return [];
}


module.exports = {
	unique
};
