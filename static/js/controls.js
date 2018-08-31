var topicsRefresh = document.getElementById('topicsRefresh');
var peopleRefresh = document.getElementById('peopleRefresh');
var organisationsRefresh = document.getElementById('organisationsRefresh');

function initControls(template){
	addListeners(template);
}

function addListeners(template){
	pageReloaders(template);
	colourSwitches();
}

function pageReloaders(template){
	topicsRefresh.addEventListener('click', function(){
		reloadPage(template, 'topics');
	});
	peopleRefresh.addEventListener('click', function(){
		reloadPage(template, 'people');
	});
	organisationsRefresh.addEventListener('click', function(){
		reloadPage(template, 'organisations');
	});
}

function reloadPage(template, facet){
	window.location.href = '/facetsWithArticles/charts/' + template + '/' + facet + '/1';
	return;
}

function colourSwitches(){
	var selectors = document.getElementsByName('d3ColourSet');

	if(selectors){
		selectors.forEach(function(selector){
			selector.addEventListener('click', function(e){
				var evt = new CustomEvent("MyEventType", {detail: e.target.defaultValue});
				window.dispatchEvent(evt);
			});
		});
	}
}