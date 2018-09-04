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
		var chartList = []
		var facets = this.datum.facets
		var table = document.createElement('table')

		facets.forEach(topic => {
			var tr = document.createElement('tr')
			var tdTitle = document.createElement('td')
			var tdSvg = document.createElement('td')
			var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
			var className = this.variabliseStr(topic.name);

			svg.classList.add(className)
			svg.setAttribute('width', 400)
			svg.setAttribute('height', 100)


			tdTitle.appendChild(document.createTextNode(topic.name))
			tdSvg.appendChild(svg)
			
			tr.appendChild(tdTitle)
			tr.appendChild(tdSvg)
			table.appendChild(tr)

			chartList.push({
				info: this.prepCount(topic.count),
				dom: className
			})
		})

		var container = document.getElementsByClassName(this.datumTarget)[0]
		container.appendChild(table)

		this.addChartsToPage(chartList)
	}

	prepCount(data){
		return data.map((counter, inc) => {
			return {date: inc, close: counter}
		})
	}

	addChartsToPage(list){
		list.forEach(chart => {
			this.createLine(chart.info, chart.dom)
		})
	}

	createLine(data, domTarget){
		var target = document.getElementsByClassName(domTarget)[0];

		var svg = d3.select(target),
		    margin = {top: 20, right: 20, bottom: 30, left: 50},
		    width = +svg.attr("width") - margin.left - margin.right,
		    height = +svg.attr("height") - margin.top - margin.bottom,
		    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var x = d3.scaleTime()
		    .rangeRound([0, width]);

		var y = d3.scaleLinear()
		    .rangeRound([height, 0]);

		var line = d3.line()
		    .x(function(d) { return x(d.date); })
		    .y(function(d) { return y(d.close); });

		x.domain(d3.extent(data, function(d) { return d.date; }));
		y.domain(d3.extent(data, function(d) { return d.close; }));

		g.append("path")
			.datum(data)
			.attr("fill", "none")
			.attr("stroke", "steelblue")
			.attr("stroke-linejoin", "round")
			.attr("stroke-linecap", "round")
			.attr("stroke-width", 1.5)
			.attr("d", line);
	}

	variabliseStr(str){
		return str.replace(/ /g, '').replace(/-/g, '').replace(/&/g, '').toLowerCase()
	}
}