const boxMask 					= document.getElementById('boxMask');
const circleMask 				= document.getElementById('circleMask');
const nonagonMask 				= document.getElementById('nonagonMask');
const guideBtn 					= document.getElementById('guideLine');
const randomiseBtn 				= document.getElementById('randomPos');
const setBtn 					= document.getElementById('setPos');
const clustersCollection 		= document.getElementsByClassName('cluster');
const clusterImagesCollection	= document.getElementsByClassName('cluster--images');
const clusters 					= [].slice.call(clustersCollection);
const clusterImages 			= [].slice.call(clusterImagesCollection);


function init(){
	addListeners();
	setPositions();
}

function addListeners(){
	randomiseBtn.addEventListener('click', randomPositions);
	setBtn.addEventListener('click', setPositions);

	boxMask.addEventListener('click', function(){
		toggleMasks('block', clusterImages);
	});

	circleMask.addEventListener('click', function(){
		toggleMasks('circle', clusterImages);
	});

	nonagonMask.addEventListener('click', function(){
		toggleMasks('nonagon', clusterImages);
	});

	guideBtn.addEventListener('click', function(){
		clusters.forEach(cluster => {
			cluster.classList.toggle("guideline");
		})
	});

	clusters.forEach(cluster => {
		cluster.addEventListener('click', function(){
			const heading = cluster.getElementsByTagName('h2')[0];
			const images = cluster.getElementsByClassName('cluster--images')[0];
			const articles = cluster.getElementsByClassName('cluster--articles')[0];

			if(images.classList.contains("selected")){
				heading.classList.remove("hidden");
				images.classList.remove("selected");
				articles.classList.add('hidden');
			} else {
				heading.classList.add("hidden");
				images.classList.add("selected");
				articles.classList.remove('hidden');
			}
		});
	});
}

function toggleMasks(type, images){
	images.forEach(img => {
		img.classList.remove("mask--block");
		img.classList.remove("mask--circle");
		img.classList.remove("mask--nonagon");

		switch(type){
			case 'block':
				img.classList.add("mask--block");
			break;
			case 'circle':
				img.classList.add("mask--circle");
			break;
			case 'nonagon':
				img.classList.add("mask--nonagon");
			break;
		}
	});
}

function setPositions(){
	clusterImages.forEach(imgCluster => {
		const maxPos = 80;
		const images = [].slice.call(imgCluster.getElementsByTagName('img'));
		const positions = [
			{h: 100, v: 100},
			{h: -75, v: 100},
			{h: -75, v: -75},
			{h: 105, v: -75},
			{h: 20, v: -75},
			{h: 20, v: 100},
			{h: -75, v: 15},
			{h: 100, v: 15},
			{h: 20, v: 15},
		];

		for (var i = 0; i < images.length; i++) {
			if(positions[i]){
				images[i].style.cssText = `transform: translate(${positions[i].h}%, ${positions[i].v}%);`;
			} else {
				images[i].style.cssText = `transform: translate(300%, 300%);`;
			}
		}
	});
}

function randomPositions(){
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