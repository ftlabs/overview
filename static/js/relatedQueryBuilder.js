
const queryLink	= document.getElementById('queryBuilderLink');
const days 		= document.getElementById('days');
const facet 	= document.getElementById('facet');

function init(){
	if(days !== undefined && facet !== undefined && queryLink !== undefined){
		facet.addEventListener('change', updateUrlBuilderLink, false);
		days.addEventListener('change', updateUrlBuilderLink, false);
		updateUrlBuilderLink();
	}
}

function updateUrlBuilderLink(){
	const facetVal 		= facet.options[facet.selectedIndex].value;
	const dayVal 		= days.options[days.selectedIndex].value;

	let str = `/topicArticles/relatedContent/?days=${dayVal}&facet=${facetVal}`;

	queryLink.href = str;
	queryLink.innerHTML = str;
}

init();