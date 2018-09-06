class HierarchicalEdgeBundlingDiagram {

	constructor(){
	}

	init(data, target){
		this.datum = this.prepData(data);
		this.datumTarget = target;
		this.start();
	}

	prepData(data){
		var reformatted = [];
		var parsed = JSON.parse(data
			.replace(/&quot;&gt;/g, '>', )
			.replace(/&lt;/g, '<', )
			.replace(/&gt;/g, '>', )
			.replace(/&quot;/g, '"', )
			.replace(/&amp;/g, '&', ));

		parsed.breakdown.forEach(facet => {
			var newObj = this.newNodeObj(parsed.facet + '.' + facet.facetName);
			newObj.size = this.calcSize(facet);
			newObj.imports = this.addImports(facet);
			reformatted.push(newObj);
		});

		return reformatted;
	}

	newNodeObj(name = "name"){
		return {
			"name": "flare." + this.variabliseStr(name),
			"size": 0,
			"imports": [],
		};
	}

	calcSize(facet){
		return facet.articleCount 
			+ facet.relatedTopicCount.length 
			+ facet.relatedPeopleCount.length 
			+ facet.relatedOrgsCount.length;
	}

	variabliseStr(str){
		return str.replace(/ /g, '').replace(/-/g, '').replace(/&/g, '');
	}

	addImports(facet){
		var topics = this.extractImports('topics', facet.relatedTopicCount);
		var people = this.extractImports('people', facet.relatedPeopleCount);
		var orgs = this.extractImports('orgs', facet.relatedOrgsCount);
		return [].concat(topics, people, orgs);
	}

	extractImports(type, data){
		var extracts = [];
		data.forEach(item => {
			extracts.push("flare." + type + "." + this.variabliseStr(item.name));
		});
		return extracts;
	}

	// TODO
	// - Fit the diagram to screen (with a minimum size to avoid crushing)
	// - break the functions outside of parent functions
	// - right now, its displaying how the main facet relates to other facets of the same type
	//		maybe there should be controls to choose which facets to display/link to
	// - add caching
	// - pre PR code review

	start(){
		var diameter = 860,
			radius = diameter / 2,
			innerRadius = radius - 120;

		var cluster = d3.cluster()
			.size([360, innerRadius]);

		var line = d3.radialLine()
			.curve(d3.curveBundle.beta(0.85))
			.radius(function(d) { return d.y; })
			.angle(function(d) { return d.x / 180 * Math.PI; });

		var svg = d3.select("body").append("svg")
			.attr("width", diameter)
			.attr("height", diameter)
			.append("g")
			.attr("transform", "translate(" + radius + "," + radius + ")");

		var link = svg.append("g").selectAll(".link");
		var node = svg.append("g").selectAll(".node");

		var root = packageHierarchy(this.datum)
			.sum(function(d) { return d.size; });

		cluster(root);

		link = link
			.data(packageImports(root.leaves()))
			.enter().append("path")
			.each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
			.attr("class", "link")
			.attr("d", line);

		node = node
			.data(root.leaves())
			.enter().append("text")
			.attr("class", "node")
			.attr("dy", "0.31em")
			.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
			.attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
			.text(function(d) { return d.data.key; })
			.on("mouseover", mouseovered)
			.on("mouseout", mouseouted);


		function mouseovered(d) {
		  node
		      .each(function(n) { n.target = n.source = false; });

		  link
		      .classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
		      .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
		    .filter(function(l) { return l.target === d || l.source === d; })
		      .raise();

		  node
		      .classed("node--target", function(n) { return n.target; })
		      .classed("node--source", function(n) { return n.source; });
		}

		function mouseouted(d) {
		  link
		      .classed("link--target", false)
		      .classed("link--source", false);

		  node
		      .classed("node--target", false)
		      .classed("node--source", false);
		}


		// Lazily construct the package hierarchy from class names.
		function packageHierarchy(classes) {
			var map = {};

			function find(name, data) {
				var node = map[name], i;
				if (!node) {
					node = map[name] = data || {name: name, children: []};
					if (name.length) {
						node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
						node.parent.children.push(node);
						node.key = name.substring(i + 1);
					}
				}
				return node;
			}

			classes.forEach(function(d) {
				find(d.name, d);
			});

			return d3.hierarchy(map[""]);
		}

		// Return a list of imports for the given array of nodes.
		function packageImports(nodes) {
			var map = {},
				imports = [];

			
			// Compute a map from name to node.
			nodes.forEach(function(d) {
				map[d.data.name] = d;
			});


			// For each import, construct a link from the source to target node.
			nodes.forEach(function(d) {
				if (d.data.imports){
					d.data.imports.forEach(function(i) {
						if(map[i]){
							imports.push(map[d.data.name].path(map[i]));
						}
					});
				}
			});
			

			return imports;
		}
	}
}