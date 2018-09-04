class Heartbeat {

	constructor(type){
		this.type = type;
	}

	init(data, target){
		this.datum = data;
		this.datumTarget = target;

		var fn = this[this.type];
		if(typeof fn === "function") this[this.type]();
	}

	prepareData(){
		return JSON.parse(data
			.replace(/&quot;&gt;/g, '>', )
			.replace(/&lt;/g, '<', )
			.replace(/&gt;/g, '>', )
			.replace(/&quot;/g, '"', )
			.replace(/&amp;/g, '&', ));
	}

	one(){
		console.log('one');
	}
}