var topicsRefresh = document.getElementById('topicsRefresh');
var peopleRefresh = document.getElementById('peopleRefresh');
var organisationsRefresh = document.getElementById('organisationsRefresh');

function init(){
	addListeners();
}

function addListeners(){
	topicsRefresh.addEventListener('click', function(){
		window.location.href = '/facetsWithArticles/charts/one/topics/1';
	});
	peopleRefresh.addEventListener('click', function(){
		window.location.href = '/facetsWithArticles/charts/one/people/1';
	});
	organisationsRefresh.addEventListener('click', function(){
		window.location.href = '/facetsWithArticles/charts/one/organisations/1';
	});
}

init();
