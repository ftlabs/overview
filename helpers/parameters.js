'use strict';

function check(type, value, min, max, range, defaultVal){
	if(value && value !== undefined && value !== null){
		if(range !== null && range.length > 0 && range.includes(value)){
			return value;
		}

		if(type === 'int'){
			if(value < min){
				return min;
			} else if(value > max){
				return max;
			} else {
				return value;
			}
		}
	}

	return defaultVal;
}

module.exports = {
	check
};
