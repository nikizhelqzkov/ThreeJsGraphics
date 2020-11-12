var t;
	
var walls, frame;

// функция за създаване на сцената
function createScene()
{
	// създаване на рисувателното поле на цял екран
	renderer = new THREE.WebGLRenderer({antialias:true});
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
	renderer.domElement.style = 'width:100%; height:100%; position:fixed; top:0; left:0; z-index:-1;';

	document.getElementById('grid').addEventListener('change',toggleGrid);
	document.getElementById('motion').addEventListener('change',toggleMotion);
	document.getElementById('bw').addEventListener('change',toggleBlackWhite);
	
	// създаване на сцена и камера
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 30, window.innerWidth/window.innerHeight, 0.1, 1000 );
	camera.position.set( 0, 0, 30 );
	camera.lookAt( scene.position );

	// създаване на земята като плоска равнина
	ground = new THREE.Mesh(
		new THREE.PlaneGeometry( 13000, 13000 ),
		new THREE.MeshPhongMaterial( { color: 'goldenrod' } )
	);
	ground.position.set( 0, -11, 0 );
	ground.rotation.set( -Math.PI/2, 0, 0 );
	scene.add( ground );

	// плътна стена
	blackFrame = new THREE.Mesh(
		new THREE.BoxGeometry( 10, 10, 2/1.003 ),
		new THREE.MeshBasicMaterial( {
			color: 'white',
			polygonOffset: true,
			polygonOffsetUnits: 2,
			polygonOffsetFactor: 2,
		})
	);
	blackFrame.visible = false;
	scene.add( blackFrame );
	
	// рамка
	grid = new THREE.Mesh(
		new THREE.BoxGeometry( 10, 10, 2 )
	);

	// тънък бял кант на рамката
	wireframe = new THREE.BoxHelper( grid );
	wireframe.material.color.set( 'lightgray' );
	wireframe.scale.set(1.003,1.003,1.003);
	wireframe.visible = false;
	scene.add( wireframe );
	
	// мрежа в рамката
	wiregrid = new THREE.GridHelper( 5, 1/2, 'gray', 'lightgray' );
	wiregrid.rotation.x = Math.PI/2;
	wiregrid.position.z = 1;
	wireframe.add( wiregrid );
	
	// амплитуда на движение
	motion = 0,
	targetMotion = 0;
	
	// bw материал
	bwMaterial = new THREE.MeshBasicMaterial({color:'black'});
	
	// създаване на четири светлини с различни цветове
	lights = [];
	var colors = [ 'dodgerblue', 'hotpink', 'cyan', 'fuchsia' ];
	for ( var i=0; i<4; i++ )
	{
		lights[i] = new THREE.PointLight( colors[i], 1 );
		scene.add( lights[i] );
	}
	
	// поддържане на пропорциите при промяна на размера на прозореца
	window.addEventListener( 'resize', onWindowResize, false );
	onWindowResize();
	
	function onWindowResize( event )
	{
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight, true );
	}
	
	// активиране на цикъла за рисуване
	drawFrame();
//	toggleFrame();
}

// функция за превключване на рамката
function toggleGrid()
{
	wireframe.visible = document.getElementById('grid').checked;
}

// функция за превключване на движението
function toggleMotion()
{
	targetMotion = document.getElementById('motion').checked ? 1 : 0;
}


// функция за превключване на черно-бял режим
function toggleBlackWhite()
{
	if ( document.getElementById('bw').checked )
	{
		for (var i=0; i<4; i++)
			lights[i].intensity = 0;
		
		blackFrame.visible = true;
		
		scene.traverse( function (object)
		{
			if( object.type=='Mesh' )
			{
				if( object!=ground && object!=blackFrame )
				{
					object.originalMaterial = object.material;
					object.material = bwMaterial;
				}
			}
		} );
	}
	else
	{
		for (var i=0; i<4; i++)
			lights[i].intensity = 1;
		
		blackFrame.visible = false;
		
		scene.traverse( function (object)
		{
			if( object.type=='Mesh' )
			{
				if( object!=ground && object!=blackFrame )
					object.material = object.originalMaterial;
			}
		} );
	}
}


// функция за анимиране на сцената
function drawFrame()
{
	requestAnimationFrame( drawFrame );
	
	t = Date.now()/1000;
	
	// леко въртене на сцената
	scene.rotation.set(
		0.1 * motion * Math.sin( t ),
		0.7 * motion * Math.sin( t/2 ),
		0.2 * motion * Math.cos( t )
	);

	motion = motion*0.99 + 0.01*targetMotion;
	
	// приближаване и отдалечаване на камерата

	// движение на светлините
	for (var i=0; i<4; i++)
	{
		var angle = t + Math.PI/2*i;
		lights[i].position.set(
			10 * (0.5+0.5*motion) * Math.cos( angle ),
			10/2 * (0.5+0.5*motion) * Math.sin( 1.5*angle ),
			10 * (0.5+0.5*motion) * Math.cos( angle )
		);
	}
	
	//рисуване на сцената
	renderer.render( scene, camera );
}		

// помощна функция за изтегляне на форма в 3D
function shape3D( shape )
{
	// създаване 3D форма чрез изтегляне
	var extrudeSettings = { amount: 2, bevelEnabled: false, curveSegments: 50 };
	var geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
		geometry.translate(0,0,-1);

	// създаване на 3D обект
	var material = new THREE.MeshPhongMaterial({color:'lightblue', shininess:120
	}),
		object = new THREE.Mesh( geometry, material );
		
	//object.material.color.setHSL( 1/8*scene.children.length, 1, 0.5 );
	
	scene.add( object );
}
