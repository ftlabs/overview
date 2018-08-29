const maskBtn 		= document.getElementById('clipMask');
const guideBtn 		= document.getElementById('guideLine');
const refreshBtn 	= document.getElementsByTagName('button')[0];
const cluster 		= document.getElementsByClassName('cluster')[0];
const clusterImages = document.getElementsByClassName('cluster--images')[0];

refreshBtn.addEventListener('click', function(){
	positionImages();
});

maskBtn.addEventListener('click', function(){
	clusterImages.classList.toggle("mask--circle");
});

guideBtn.addEventListener('click', function(){
	cluster.classList.toggle("guideline");
});

function positionImages(){
	const imgCluster = document.getElementsByClassName('cluster--images')[0];
	const images = [].slice.call(imgCluster.getElementsByTagName('img'));
	const maxPos = 80;

	images.forEach(img => {
		const hor = Math.floor(Math.random() * maxPos);
		const ver = Math.floor(Math.random() * maxPos);
		const horPlusMinus = Math.random() < 0.5 ? -hor : hor;
		const verPlusMinus = Math.random() < 0.5 ? -ver : ver;
		img.style.cssText = `transform: translate(${horPlusMinus}%, ${verPlusMinus}%);`;
	});
}

positionImages();