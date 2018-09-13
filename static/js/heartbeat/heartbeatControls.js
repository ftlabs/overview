var topicsRefresh = document.getElementById('topicsRefresh');
var peopleRefresh = document.getElementById('peopleRefresh');
var organisationsRefresh = document.getElementById('organisationsRefresh');

function initControls(template){
	addListeners(template);
}

function addListeners(template){
	pageReloaders(template);
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
	window.location.href = '/heartbeat/' + template + '/' + facet + '/20';
	return;
}