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
		var svg = d3.select("svg"),
		    margin = {top: 20, right: 20, bottom: 30, left: 50},
		    width = +svg.attr("width") - margin.left - margin.right,
		    height = +svg.attr("height") - margin.top - margin.bottom,
		    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var parseTime = d3.timeParse("%d-%b-%y");

		var x = d3.scaleTime()
		    .rangeRound([0, width]);

		var y = d3.scaleLinear()
		    .rangeRound([height, 0]);

		var line = d3.line()
		    .x(function(d) { return x(d.date); })
		    .y(function(d) { return y(d.close); });

		d3.tsv("data.tsv", function(d) {
		  d.date = parseTime(d.date);
		  d.close = +d.close;
		  return d;
		}, function(error, data) {
		  if (error) throw error;

		  x.domain(d3.extent(data, function(d) { return d.date; }));
		  y.domain(d3.extent(data, function(d) { return d.close; }));

		  g.append("g")
		      .attr("transform", "translate(0," + height + ")")
		      .call(d3.axisBottom(x))
		    .select(".domain")
		      .remove();

		  g.append("g")
		      .call(d3.axisLeft(y))
		    .append("text")
		      .attr("fill", "#000")
		      .attr("transform", "rotate(-90)")
		      .attr("y", 6)
		      .attr("dy", "0.71em")
		      .attr("text-anchor", "end")
		      .text("Price ($)");

		  g.append("path")
		      .datum(data)
		      .attr("fill", "none")
		      .attr("stroke", "steelblue")
		      .attr("stroke-linejoin", "round")
		      .attr("stroke-linecap", "round")
		      .attr("stroke-width", 1.5)
		      .attr("d", line);
		});
	}
}