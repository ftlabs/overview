
const queryLink	= document.getElementById('queryBuilderLink');
const days 		= document.getElementById('days');
const facet 	= document.getElementById('facet');
const aspects 	= document.getElementById('aspects');

function init(){
	if(days !== undefined && facet !== undefined && queryLink !== undefined){
		facet.addEventListener('change', updateUrlBuilderLink, false);
		days.addEventListener('change', updateUrlBuilderLink, false);
		aspects.addEventListener('change', updateUrlBuilderLink, false);
		updateUrlBuilderLink();
	}
}

function updateUrlBuilderLink(){
	const facetVal 		= facet.options[facet.selectedIndex].value;
	const dayVal 		= days.options[days.selectedIndex].value;
	const aspectsArr 	= Array.apply(null, aspects.options);
	const aspectsVal 	= getMultipleSelects(aspectsArr);

	let str = `/facetsWithArticles/relatedContent/?days=${dayVal}&facet=${facetVal}&aspects=${aspectsVal}`;

	queryLink.href = str;
	queryLink.innerHTML = str;
}

function getMultipleSelects(select){
	return select.reduce( (result, item) => {

		if(item.selected === true){
			result.push(item.value);
		}
		return result;
	}, []);
}

init();