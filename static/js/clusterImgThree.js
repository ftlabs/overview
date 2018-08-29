const refreshBtn = document.getElementsByTagName('button')[0];
refreshBtn.addEventListener('click', function(){
	location.reload();
});

function positionImages(){
	const imgCluster = document.getElementsByClassName('cluster--images')[0];
	const images = [].slice.call(imgCluster.getElementsByTagName('img'));
	const maxPos = 100;

	images.forEach(img => {
		const hor = Math.floor(Math.random() * maxPos);
		const ver = Math.floor(Math.random() * maxPos);

		horPlusMinus = Math.random() < 0.5 ? -hor : hor;
		verPlusMinus = Math.random() < 0.5 ? -ver : ver;

		img.style.cssText = `transform: translate(${horPlusMinus}%, ${verPlusMinus}%);`;
	});
}

positionImages();