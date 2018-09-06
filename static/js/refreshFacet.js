class RefreshFacet{

	constructor(path){
		this.path = path;
		this.topicsRefresh = document.getElementById('topicsRefresh');
		this.peopleRefresh = document.getElementById('peopleRefresh');
		this.organisationsRefresh = document.getElementById('organisationsRefresh');
		this.pageReloaders();
	}

	pageReloaders(){
		var scope = this;
		this.topicsRefresh.addEventListener('click', function(){
			scope.reloadPage('topics');
		});
		this.peopleRefresh.addEventListener('click', function(){
			scope.reloadPage('people');
		});
		this.organisationsRefresh.addEventListener('click', function(){
			scope.reloadPage('organisations');
		});
	}

	reloadPage(facet){
		window.location.href = '/' + this.path + '/' + facet;
		return;
	}
}