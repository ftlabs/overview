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

	prepData(data){
		return JSON.parse(data
			.replace(/&quot;&gt;/g, '>', )
			.replace(/&lt;/g, '<', )
			.replace(/&gt;/g, '>', )
			.replace(/&quot;/g, '"', )
			.replace(/&amp;/g, '&', ));
	}

	one(){
		var facets = this.datum.facets
		var table = document.createElement('table')

		// TODO - add a display for the time ranges of each columned result

		facets.forEach(topic => {
			var tr = document.createElement('tr')
			var td = document.createElement('td')

			td.appendChild(document.createTextNode(topic.name))
			tr.appendChild(td)

			topic.count.forEach(item => {
				var td = document.createElement('td')
				var val = (item) ? item : 0
				td.appendChild(document.createTextNode(val))
                tr.appendChild(td)
			})

			table.appendChild(tr)
		})

		var container = document.getElementsByClassName(this.datumTarget)[0]
		container.appendChild(table)
	}

	two(){

	}
}