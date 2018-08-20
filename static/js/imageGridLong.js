window.addEventListener('resize', calculateImageSizes);

function calculateImageSizes(){
	const containers 		= document.getElementsByTagName('a');
	const containersList	= Array.prototype.slice.call(containers);

	console.log("containersList.length: " + containersList.length);


	if(containersList.length > 0){
		let imgWidth = (100 / containersList.length);

		containersList.forEach(container => {
			container.style.width = imgWidth + '%';
		});

		console.log(imgWidth * 100);
	}
	
}

calculateImageSizes();