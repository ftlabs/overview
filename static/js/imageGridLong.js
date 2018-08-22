window.addEventListener('resize', calculateImageSizes);

function calculateImageSizes(){
	const containers 		= document.getElementsByTagName('a');
	const containersList	= Array.prototype.slice.call(containers);

	if(containersList.length > 0){
		let imgWidth = (100 / containersList.length);

		containersList.forEach(container => {
			container.style.width = imgWidth + '%';
		});x
	}
	
}

calculateImageSizes();