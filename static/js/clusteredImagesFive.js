const maskBtn 					= document.getElementById('clipMask');
const guideBtn 					= document.getElementById('guideLine');
const refreshBtn 				= document.getElementsByTagName('button')[0];
const clustersCollection 		= document.getElementsByClassName('cluster');
const clusterImagesCollection	= document.getElementsByClassName('cluster--images');
const clusters 					= [].slice.call(clustersCollection);
const clusterImages 			= [].slice.call(clusterImagesCollection);

function init(){
	addListeners();
	positionImages();
}

function addListeners(){
	refreshBtn.addEventListener('click', function(){
		positionImages();
	});

	maskBtn.addEventListener('click', function(){
		clusterImages.forEach(clusterImg => {
			clusterImg.classList.toggle("circlemask");
		})
	});

	guideBtn.addEventListener('click', function(){
		clusters.forEach(cluster => {
			cluster.classList.toggle("guideline");
		})
	});
}

function positionImages(){
	clusterImages.forEach(imgCluster => {
		const maxPos = 80;
		const images = [].slice.call(imgCluster.getElementsByTagName('img'));

		images.forEach(img => {
			const hor = Math.floor(Math.random() * maxPos);
			const ver = Math.floor(Math.random() * maxPos);

			horPlusMinus = Math.random() < 0.5 ? -hor : hor;
			verPlusMinus = Math.random() < 0.5 ? -ver : ver;

			img.style.cssText = `transform: translate(${horPlusMinus}%, ${verPlusMinus}%);`;
		});
	});
}

init();