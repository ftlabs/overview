window.addEventListener('resize', calculateImageSizes);

function calculateImageSizes(){
	const imgs 		= document.getElementsByTagName('img');
	const imgsList	= Array.prototype.slice.call(imgs);
	const area 		= (window.innerWidth * window.innerHeight);

	if(imgsList.length > 0){
		let numItems 		= imgsList.length;
		let imageArea 		= fitIntoArea(area, numItems);
		let imageDimensions = calcDimensions(imageArea, 16, 9);

		imgsList.forEach(img => {
			img.style.width = imageDimensions.width + 'px ';
			img.style.height = imageDimensions.height + 'px ';
		});
	}
}

/*
 * Establish the dimensions for the number of items intended to fill an area
 *
 * @area integer 2D area to be filled
 * @numItems integer number of items to fill the area with
 *
 */
function fitIntoArea(area, numItems){
	let increment       = 100;
	let step			= 1;
	let progressImage 	= 0;
	let progressTotal 	= 0;

	while (increment > 0.1){

		while(progressTotal < area){
			let [tempArea, tempTotalArea] = areaCalc(step, increment, progressImage, numItems)

			if(tempTotalArea > area){
				[progressImage, progressTotal] = areaCalc(step-1, increment, progressImage, numItems)
				step = 1;
				increment = increment / 2;
				break;
			}

			// emergency limit catcher
			if(increment <= 0.01){ console.log("increment : hard limiter"); return; }

			// emergency limit catcher
			if(step >= 100){ console.log("step : hard limiter"); return; }

			step++;
		}

	}

	// add leftover difference to the items
	let leftover = (area - progressTotal) / numItems;

	return progressImage + leftover;
}

/*
 * Calculating the next area estimate in the loop
 *
 * @iteration integer number of iteration sequence
 * @increment integer value to increase teh area calculation by
 * @offset integer totla of periously calculated that does not exceed area
 * @totalItems integer number of items to fill the area with
 *
 */
function areaCalc(iteration, increment, offset, totalItems){
	let singleArea = offset + ( ( (iteration) * increment ) * ( (iteration) * increment ) );
	let totalArea = singleArea * totalItems;
	return [singleArea, totalArea];
}

/*
 * Calculate the width & height dimensions for an item, given the ratio and area
 *
 * @area integer 2D area to be filled
 * @numItems integer number of items to fill the area with
 *
 */
function calcDimensions(area, ratioW, ratioH){
	let numX	 = ratioW * ratioH;
	let xSquared = area / numX;
	let x = Math.sqrt(xSquared);
	return {
		width : Math.ceil(x * ratioW),
		height : Math.ceil(x * ratioH),
	};
}


calculateImageSizes();