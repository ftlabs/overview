const debug = require('debug')('bin:lib:cache');

function getDatetimeRange(period, frequency, offset, past = true, iso = true){
	let currDate			= new Date().getTime();
	let originTime			= 0;
	let diffTime			= 0;
	let offsetFrequency		= Number(Number(frequency) + Number(offset));

	if(past === true){
		originTime = currDate - msDuration(period, offset);
		diffTime = currDate - msDuration(period, offsetFrequency);
	} else {
		originTime = currDate + msDuration(period, offset);
		diffTime = currDate + msDuration(period, offsetFrequency);
	}

	if(iso === true){
		return {
			first: new Date( originTime ).toISOString().split('.')[0] + "Z",
			next: new Date( diffTime ).toISOString().split('.')[0] + "Z",
		}
	} else {
		return {
			first: new Date( originTime ),
			next: new Date( diffTime ),
		}
	}
}

function msDuration(period, increment){
	var ms = 0;

	switch(period){
		case 'minutes':
			ms = increment * (60 * 1000);
			break;
		case 'hours':
			ms = increment * (60 * 60 * 1000);
			break;
		case 'days':
			ms = increment * (24 * 60 * 60 * 1000);
			break;
	}
	ms = Math.round(ms);
	return ms;
}

module.exports = {
	getDatetimeRange
};
