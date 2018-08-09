function status(response) {
	if (response.status >= 200 && response.status < 300) {
		return Promise.resolve(response)
	} else {
		return Promise.reject(new Error(response.statusText))
	}
}

function json(response) {
	return response.json()
}

function infoWrapper(element){
	var output = '';
	var filterdData = getRequiredInfo(element);

	output = '<div class="item">' + domWrap('p', filterdData.title) + '</div>'
	return output;
}

function imageWrapper(element){
	var output = '';
	var filterdData = getRequiredInfo(element);

	if(filterdData.image !== null){
		output = '<a href="' + filterdData.link + '"><img src="' + filterdData.image + '" alt="' + filterdData.title + '"></img></a>';
	}
	return output;
}

function domWrap(tag, content){
	return '<' + tag + '>' + content + '</' + tag + '>';
}

function getRequiredInfo(element){
	return {
		'title' : getTitle(element),
		'image' : getImage(element),
		'link' 	: getLink(element),
	}
}

function getTitle(obj){
	return sliceQuotes(JSON.stringify(obj.title.title, null, 2));
}

function getSubheading(obj){
	return sliceQuotes(JSON.stringify(obj.editorial.subheading, null, 2));
}

function getLink(obj){
	if(obj.hasOwnProperty('location') && obj.location.uri !== undefined){
		return sliceQuotes(JSON.stringify(obj.location.uri, null, 2));
	}
	return null;
}

function getImage(obj){
	if(obj.hasOwnProperty('images') && obj.images[0] !== undefined){
		return sliceQuotes(JSON.stringify(obj.images[0].url, null, 2));
	}
	return null;
}

function sliceQuotes(str){
	//should check if the first and last characters are actually quotation marks before removing
	return str.substr(1).slice(0, -1);
}