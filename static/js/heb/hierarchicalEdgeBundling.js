class HierarchicalEdgeBundlingDiagram {

	constructor(){
	}

	init(data, target){
		this.scp = this;
		this.datum = this.prepData(data);
		this.datumTarget = target;
		this.itemList = [];

		this.links = null;
		this.nodes = null;
	}

	draw(){
		this.start();
	}

	refreshDiagram(){
		this.removeDiagram();
		this.start();
	}

	removeDiagram(){
		var svg = document.getElementsByTagName('svg')[0];
		if(svg){
			svg.parentNode.removeChild(svg);
		}
	}

	prepData(data){
		var reformatted = [];
		var parsed = JSON.parse(this.formatStr(data));

		parsed.breakdown.forEach(facet => {
			var newObj = this.newNodeObj(parsed.facet, facet.facetName);
			newObj.size = this.calcSize(facet);
			newObj.imports = this.addImports(facet);
			reformatted.push(newObj);
		});

		return reformatted;
	}

	formatStr(str){
		return str.replace(/&quot;&gt;/g, '>')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&amp;/g, '&');
	}

	newNodeObj(facet, name = "name"){
		return {
			"name": "flare." + facet + '.' + this.sanatiseStr(name),
			"size": 0,
			"imports": [],
		};
	}

	calcSize(facet){
		return facet.articleCount + facet.relatedTopicCount.length + facet.relatedPeopleCount.length + facet.relatedOrgsCount.length;
	}

	sanatiseStr(str){
		return str.replace(/\./g, ' ').replace(/&#x27;/g, '\'');
	}

	variabliseStr(str){
		return str.replace(/ /g, '').replace(/-/g, '').replace(/&/g, '').replace(/\./g, '');
	}

	addImports(facet){
		var topics = this.extractImports('topics', facet.relatedTopicCount);
		var people = this.extractImports('people', facet.relatedPeopleCount);
		var orgs = this.extractImports('organisations', facet.relatedOrgsCount);
		return [].concat(topics, people, orgs);
	}

	extractImports(type, data){
		var extracts = [];
		data.forEach(item => {
			extracts.push("flare." + type + "." + this.sanatiseStr(item.name));
		});
		return extracts;
	}

	listItems(){
		this.datum.forEach(item => {
			var split = item.name.split(".");
			this.itemList.push(split[split.length -1]);
		});
	}

	getItems(){
		if(this.itemList.length <= 0){
			this.listItems();
		}
		return this.itemList;
	}

	start(){
		var wWidth = window.innerWidth;
		var wHeight = (window.innerHeight > 600) ? window.innerHeight : 600;

		var diameter = wWidth,
			radius = wHeight / 2,
			innerRadius = radius - 180;

		var cluster = d3.cluster()
			.size([360, innerRadius]);

		var line = d3.radialLine()
			.curve(d3.curveBundle.beta(0.85))
			.radius(function(d) { return d.y; })
			.angle(function(d) { return d.x / 180 * Math.PI; });

		//mandala madness
		//.angle(function(d) { return d.x; });

		var svg = d3.select("main").append("svg")
			.attr("width", diameter)
			.attr("height", diameter)
			.append("g")
			.attr("transform", "translate(" + wWidth / 2 + "," + radius + ")");

		var link = svg.append("g").selectAll(".link");
		var node = svg.append("g").selectAll(".node");

		this.testVar = "testVar";

		var root = packageHierarchy(this.datum)
			.sum(function(d) { return d.size; });

		cluster(root);

		link = link
			.data(packageImports(root.leaves()))
			.enter().append("path")
			.each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
			.attr("class", "link")
			.attr("d", line);

		this.link = link;

		node = node
			.data(root.leaves())
			.enter().append("text")
			.attr("id", function(d) { return d.data.key; })
			.attr("class", "node")
			.attr("dy", "0.31em")
			.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
			.attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
			.text(function(d) { return d.data.key; })
			.on("mouseover", mouseovered)
			.on("mouseout", mouseouted);

		this.node = node;


		function mouseovered(d) {
			link
				.classed("link--target", function(l) { if (l.target === d){
					l.source.source = true;
					return true;
					} 
				})
	      		.filter(function(l) { return l.target === d || l.source === d; })
	      		.raise();
		}

		function mouseouted(d) {
			link.classed("link--target", false);
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