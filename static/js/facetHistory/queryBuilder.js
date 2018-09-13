
const queryLink			= document.getElementById('queryBuilderLink');
const facet 			= document.getElementById('facet');
const period 			= document.getElementById('period');
const interval 			= document.getElementById('interval');
const numInterval 		= document.getElementById('numInterval');
const maxFacets 		= document.getElementById('maxFacets');

function init(){
	if(facet !== undefined && period !== undefined && interval !== undefined 
	&& numInterval !== undefined && maxFacets !== undefined && queryLink !== undefined){

		facet.addEventListener('change', updateUrlBuilderLink, false);
		period.addEventListener('change', updateUrlBuilderLink, false);
		interval.addEventListener('change', updateUrlBuilderLink, false);
		numInterval.addEventListener('change', updateUrlBuilderLink, false);
		maxFacets.addEventListener('change', updateUrlBuilderLink, false);

		updateUrlBuilderLink();
	}
}

function updateUrlBuilderLink(){
	const facetVal 			= facet.options[facet.selectedIndex].value;
	const periodVal 		= period.options[period.selectedIndex].value;
	const intervalVal 		= interval.options[interval.selectedIndex].value;
	const numIntervalVal 	= numInterval.options[numInterval.selectedIndex].value;
	const maxFacetsVal 		= maxFacets.options[maxFacets.selectedIndex].value;

	let str = `/facetHistory/${facetVal}?period=${periodVal}&interval=${intervalVal}&numInterval=${numIntervalVal}&maxFacets=${maxFacetsVal}`;

	queryLink.href = str;
	queryLink.innerHTML = str;
}

init();