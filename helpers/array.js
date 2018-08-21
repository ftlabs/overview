'use strict';

function unique(arrays){
	return ( [ ...new Set( [].concat(...arrs) ) ] );
}


module.exports = {
	unique
};
