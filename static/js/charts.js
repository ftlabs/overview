class ChartBuilder {
	constructor(type) {
		this.type = type;
	}

	init(data, className){
		var fn = this[this.type + "Init"];
		if(typeof fn === "function") fn(data, className);
	} 

	oneInit(data, className){
		d3.select('.' + className)
			.selectAll("div")
			.data(data)
				.enter()
				.append("div")
				.style("width", function(d) { return (d.articleCount * 10) + "px"; })
				.text(function(d){ return d.facetName; });
	} 
}