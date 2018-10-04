class ChartBuilder {

	constructor(type) {
		this.type = type;
		this.dataset = { "children": [] };
	}


	init(data, targetObj){
		this.datum = data;
		this.targetObj = targetObj;

		var fn = this[this.type];
		if(typeof fn === "function"){
            this[this.type]();
        } 
	}

	prepareData(data){
		return JSON.parse(data
			.replace(/&quot;&gt;/g, '>', )
			.replace(/&lt;/g, '<', )
			.replace(/&gt;/g, '>', )
			.replace(/&quot;/g, '"', )
			.replace(/&amp;/g, '&', ));
	}

	one(){

        console.log(this.datum);

		d3.select('.' + this.targetObj)
			.selectAll("div")
			.data(this.datum)
				.enter()
				.append("div")
				.style("width", function(d) { return (d.articleCount * 10) + "px"; })
				.text(function(d){ return d.facetName; });
	} 

	/*
	 * Heavily lifted from:
	 * https://bl.ocks.org/alokkshukla/3d6be4be0ef9f6977ec6718b2916d168
	 */
	two(){
        var dataset = { "children": [] };
        this.datum.forEach(item => {
        	dataset.children.push({"Name": item.facetName, "Count": item.articleCount})
        });

        this.dataset = dataset;
        this.drawBubbleChart(dataset, 'schemeDark2');
        this.initColourChangeListeners(dataset);
	}

	drawBubbleChart(dataset, scheme){
		d3.select("svg").remove();

		var diameter = 600;
        var colour = d3.scaleOrdinal(d3[scheme]);

        if(scheme === 'schemeGreys'){
        	colour = d3.scaleOrdinal(d3[scheme][dataset.length]);
        }

        var bubble = d3.pack(dataset)
            .size([diameter, diameter])
            .padding(1.5);

        var svg = d3.select("main")
            .append("svg")
            .attr("width", diameter)
            .attr("height", diameter)
            .attr("class", "bubble");

        var nodes = d3.hierarchy(dataset)
            .sum(function(d) { return d.Count; });

        var node = svg.selectAll(".node")
            .data(bubble(nodes).descendants())
            .enter()
            .filter(function(d){
                return  !d.children
            })
            .append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

        node.append("title")
            .text(function(d) {
                return d.Name + ": " + d.Count;
            });

        node.append("circle")
            .attr("r", function(d) {
                return d.r;
            })
            .style("fill", function(d,i) {
                return colour(i);
            });

        node.append("text")
            .attr("dy", ".2em")
            .style("text-anchor", "middle")
            .text(function(d) {
                return d.data.Name.substring(0, d.r / 3);
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", function(d){
                return d.r/5;
            })
            .attr("fill", "white");

        node.append("text")
            .attr("dy", "1.3em")
            .style("text-anchor", "middle")
            .text(function(d) {
                return d.data.Count;
            })
            .attr("font-family",  "Gill Sans", "Gill Sans MT")
            .attr("font-size", function(d){
                return d.r/5;
            })
            .attr("fill", "white");

        d3.select(self.frameElement)
            .style("height", diameter + "px");
	}

	initColourChangeListeners() {
		var scope = this;
		window.addEventListener('MyEventType', function(e){
			scope.drawBubbleChart(scope.dataset, e.detail);
		});
	}
}