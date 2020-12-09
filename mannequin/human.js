// човече - с възможност за движение на ставите,
// създадено специално за второто домашно по ОКГ


/*
	human	.bend(x)  .turn(x,dir) .tilt(x,dir)
	  torso	.bend(x)  .turn(x,dir) .tilt(x,dir)
	  head	.nod(x)   .turn(x,dir) .tilt(x,dir)
	leg		.raise(x) .straddle(x,dir) .turn(x,dir)
	  knee	.bend(x)
	  ankle	.bend(x)  .turn(x,dir) .tilt(x,dir)
	arm		.raise(x) .straddle(x,dir) .turn(x,dir)
	  elbow	.bend(x)
	  wrist	.bend(x)  .turn(x,dir) .tilt(x,dir)
	  fingers	.bend(x)
*/

		
// създаване на сцената
function createScene()
{
	// рисувателно поле
	renderer = new THREE.WebGLRenderer({antialias:true});
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.domElement.style = 'width:100%; height:100%; position:fixed; top:0; left:0; z-index:-1;';
		renderer.shadowMap.enabled = true;
		renderer.setAnimationLoop(drawFrame);
		document.body.appendChild( renderer.domElement );


	// сцена
	scene = new THREE.Scene();
		scene.background = new THREE.Color('gainsboro');
		scene.fog = new THREE.Fog('gainsboro',100,600);


	// камера
	camera = new THREE.PerspectiveCamera( 50, window.innerWidth/window.innerHeight, 0.1, 2000 );
		camera.position.set(50,20,150);
	
	
	// светлини
	var light = new THREE.PointLight('white',0.5);
		light.position.set(0,100,50);
		light.shadow.mapSize.width = 1024;
		light.shadow.mapSize.height = 1024;	
		light.castShadow = true;
		scene.add( light, new THREE.AmbientLight('white',0.5) );
	
	
	// поддържане на пропорциите при промяна на размера на прозореца
	window.addEventListener( 'resize', onWindowResize, false );
	onWindowResize();
	
	// земя
	var ground = new THREE.Mesh(
			new THREE.BoxGeometry(1000,1,1000),
			new THREE.MeshPhongMaterial({color:'antiquewhite',shininess:1})
		);
		ground.receiveShadow = true;
		ground.position.y = -30;
		scene.add( ground );

	
	// таймер
	clock = new THREE.Clock();
}


function onWindowResize( event )
{
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight, true );
}


function drawFrame()
{
	if( animate ) animate(100*clock.getElapsedTime());
	renderer.render( scene, camera );
}

	
// помощни функции за работа с градуси
function rad(x) {return x*Math.PI/180;}
function sin(x) {return Math.sin(rad(x));}
function cos(x) {return Math.cos(rad(x));}


// посоки на движение
const LEFT = -1;
const RIGHT = 1;


// цветове и вградени текстури за глава и крайници
var colors = [
	'antiquewhite',	// глава
	'gray',			// обувка
	'antiquewhite',	// таз
	'burlywood',	// сферички
	'antiquewhite',	// крайник
	'bisque'		// торс
]; 


// вградена текстура за главата
var texHead = new THREE.TextureLoader().load("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABABAMAAABYR2ztAAAAGFBMVEX////Ly8v5+fne3t5GRkby8vK4uLi/v7/GbmKXAAAAZklEQVRIx2MYQUAQHQgQVkBtwEjICkbK3MAkQFABpj+R5ZkJKTAxImCFSSkhBamYVgiQrAADEHQkIW+iqiBCAfXjAkMHpgKqgyHgBiwBRfu4ECScYEZGvkD1JxEKhkA5OVTqi8EOAOyFJCGMDsu4AAAAAElFTkSuQmCC");


// вградена текстура за крайниците и тялото
var texLimb = new THREE.TextureLoader().load("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAQMAAACQp+OdAAAABlBMVEX////Ly8vsgL9iAAAAHElEQVQoz2OgEPyHAjgDjxoKGWTaRRkYDR/8AAAU9d8hJ6+ZxgAAAABJRU5ErkJggg==");


// шаблон за сферичка, която се слага в ставите
var sphere = new THREE.Mesh(
		new THREE.SphereBufferGeometry(1, 16, 8),
		new THREE.MeshPhongMaterial({color:colors[3],shininess:	1})
	);
sphere.castShadow = true;
sphere.receiveShadow = true;


// изчислява косинусова издутина
function cossers(u,v,params)
{
	function cosser(t, min, max)
	{
		if (t<min) t++;
		if (t>max) t--;
		if( min<=t && t<=max )
			return 0.5+0.5*Math.cos( (t-min)/(max-min)*2*Math.PI-Math.PI );
		return 0;
	}
	for (var i=0, r=1; i<params.length; i++)
		r += cosser(u,params[i][0],params[i][1])*cosser(v,params[i][2],params[i][3])/params[i][4];
	return r;
}


// създава параметрична повърхност чрез функцията ѝ
class ParametricShape extends THREE.Group
{
	constructor(tex,col,func,nx=3,ny=3)
	{
		super();
		var obj = new THREE.Mesh(
			new THREE.ParametricBufferGeometry(func, nx, ny),
			new THREE.MeshPhongMaterial({color:col, shininess:1, map:tex})
		);
		obj.receiveShadow = true;
		obj.castShadow = true;
		this.add( obj );

	}

	addSphere(r,y)
	{
		var s = sphere.clone();
		s.scale.set(r,r,r);
		s.position.set(0,y,0);
		this.add(s);
	}
		
}


// форма на глава като параметрична повърхнина
class HeadShape extends ParametricShape
{
	constructor(feminine,params)
	{
		super(texHead,colors[0],function (u,v,target)
		{
			var r = cossers(u,v,[[0.4,0.9,0,1,-3],[0,1,0,0.1,3],[0,1,0.9,1,3],[1.00,1.05,0.55,0.85,-3],[1.00,1.05,0.15,0.45,-3],[0.93,1.08,0.40,0.60,8],[0.0,0.7,0.05,0.95,3],[-0.2,0.2,-0.15,1.15,-6],
				[-0.07,0.07,0.45,0.55,20], // нос
				[-0.07,0.01,0.35,0.55,10], // ноздра
				[-0.07,0.01,0.45,0.65,10], // ноздра
			]);
			u = 360*u;
			v = 180*v-90;
			var k = (1+(feminine?1:2)*sin(u)*cos(v))/4;
			target.set(
				r*params[0]*cos(u)*cos(v),
				r*params[1]*sin(u)*cos(v),
				(r+k)*params[2]*sin(v));
		},32,32);
	}
}


// форма на обувка като параметрична повърхнина
class ShoeShape extends THREE.Group
{
	constructor(feminine,params)
	{
		super();
		
		this.add(new ParametricShape(texLimb,colors[1],function (u,v,target)
		{
			var r = cossers(u,v,[[0.6,1.1,0.05,0.95,1],[0.6,0.68,0.35,0.65,feminine?1.2:1000]]);
			u = 360*u;
			v = 180*v-90;
			target.set(
				(3*r-2)*params[0]*(cos(u)*cos(v)+(feminine?(Math.pow(sin(u+180),2)*cos(v)-1):0))-(feminine?0:2),
				params[1]*sin(u)*cos(v)+2,
				params[2]*sin(v));
		},24,12));
		
		if (feminine)
		{
			this.add(new ParametricShape(texLimb,colors[4],function (u,v,target)
			{
				var r = cossers(u,v,[[0.6,1.1,0.05,0.95,1/2]]);
				u = 360*u;
				v = 180*v-90;
				target.set(
					0.3*(3*r-2)*params[0]*(cos(u)*cos(v)),
					0.8*params[1]*sin(u)*cos(v)+2,
					0.6*params[2]*sin(v));
			},12,12));
			
			this.children[0].rotation.set(0,0,0.4);
			this.children[1].rotation.set(0,0,0.4);
		}
	}
}


// форма на таз като параметрична повърхнина
class PelvisShape extends ParametricShape
{
	constructor(feminine,params)
	{
		super(texLimb,colors[2],function (u,v,target)
		{
			var r = cossers(u,v,[[0.6,0.95,0,1,4],[0.7,1.0,0.475,0.525,-13],[0.0,0.3,0.3,0.9,feminine?1000:5],[-0.2,0.3,0,0.3,-4],[-0.2,0.3,-0.3,0,-4]]);
			u = 360*u-90;
			v = 180*v-90;
			target.set(
				-1.5+r*params[0]*cos(u)*Math.pow(cos(v),0.6),
				r*params[1]*sin(u)*Math.pow(cos(v),0.6),
				r*params[2]*sin(v));
		},20,10);
	}
}


// форма на крайник като параметрична повърхнина
class LimbShape extends ParametricShape
{
	constructor(feminine,params,nx=24,ny=12)
	{
		var x=params[0], y=params[1], z=params[2], alpha=params[3], dAlpha=params[4], offset=params[5], scale=params[6], rad=params[7];
		super(texLimb,colors[4], function (u,v,target)
		{
			v = 360*v;
			var r = offset+scale*cos(alpha+dAlpha*u);
			target.set(x*r*cos(v)/2,y*u,z*r*sin(v)/2);
			var w = new THREE.Vector3(x*cos(v)*cos(170*u-85)/2,
				y*(1/2+sin(180*u-90)/2),
				z*sin(v)*cos(180*u-90)/2);
			target = target.lerp(w,Math.pow(Math.abs(2*u-1),16));
		},nx,ny);
		this.children[0].position.set(0,-y/2,0);

		if( rad ) this.addSphere(rad?rad:z/2,-y/2);
	}
}


// форма на торс като параметрична повърхнина
class TorsoShape extends ParametricShape
{
	constructor(feminine,params)
	{
		var x=params[0], y=params[1], z=params[2], alpha=params[3], dAlpha=params[4], offset=params[5], scale=params[6];
		super(texLimb,colors[5], function (u,v,target)
		{
			var r = offset+scale*cos(alpha+dAlpha*u);
			if (feminine) r += cossers(u,v,[[0.35,0.85,0.7,0.95,2],[0.35,0.85,0.55,0.8,2]])-1;
			v = 360*v+90;
			var x1 = x*(0.3+r)*cos(v)/2;
			var y1 = y*u;
			var z1 = z*r*sin(v)/2;
			var x2 = x*cos(v)*cos(180*u-90)/2;
			var y2 = y*(1/2+sin(180*u-90)/2);
			var z2 = z*sin(v)*cos(180*u-90)/2;
			var k = Math.pow(Math.abs(2*u-1),16);
			var kx = Math.pow(Math.abs(2*u-1),2);
			if (x2<0) kx=k;
			target.set(x1*(1-kx)+kx*x2,y1*(1-k)+k*y2,z1*(1-k)+k*z2);
		},30,20);
		
		this.children[0].position.set(0,-y/2,0);

		this.addSphere(2,-y/2);
	}
}


// дефиниция на подвижна става с възможност за подстави
class Joint extends THREE.Group
{
	constructor(parentJoint,pos,rot,params,shape)
	{
		super();
		var y = params[1];
	
		var image = new shape(parentJoint?parentJoint.feminine:false,params);
		if (shape!=PelvisShape && shape!=ShoeShape) image.position.set(0,y/2,0);
		image.castShadow=true;


		this.userJoint = new THREE.Group();
		this.userJoint.add(image);
		this.userJoint.castShadow = true;
		this.add(this.userJoint);
		this.castShadow = true;
		this.y=y;
		this.parentJoint = parentJoint;
		
		if (parentJoint)
		{	// закачане на ставата към родителската става
			this.position.set(0,parentJoint.y,0);
			parentJoint.children[0].add(this);
			this.feminine = parentJoint.feminine;
		}
		
		if (rot)
		{	// първоначално завъртане на ставата
			this.rotateX(rad(rot[0]));
			this.rotateZ(rad(rot[2]));
			this.rotateY(rad(rot[1]));
		}
		
		if (pos)
		{	// първоначално разположение на ставата
			this.position.set(pos[0],pos[1],pos[2]);
		}
		
		this.bendAngle = 0;
		this.turnAngle = 0;
		this.tiltAngle = 0;
	}

	direct(x,y,z)
	{
		this.tiltAngle = x;
		this.turnAngle = y;
		this.bendAngle = z;
		this._turn();
	}
	
	
	bend(angle)
	{
		this.bendAngle = angle;
		this._turn();
	}
	
	turn(angle,leftOrRight=LEFT)
	{
		this.turnAngle = leftOrRight*angle;
		this._turn();
	}
	
	tilt(angle,leftOrRight=LEFT)
	{
		this.tiltAngle = leftOrRight*angle;
		this._turn();
	}
	
	_turn()
	{
		this.turnJoint(this.tiltAngle,-this.turnAngle,-this.bendAngle);
	}

	turnJoint(x,y=0,z=0,order='XYZ')
	{
		this.children[0].rotation.set(rad(x),rad(y),rad(z),order);
	}
	
	// скрива ставата
	hide()
	{
		this.children[0].children[0].visible = false;
	}

	// добавя нов ThreeJS обект към ставата
	attach(image)
	{
		this.children[0].add(image);
	}

	// изчислява глобалните координати на точка (x,y,z),
	// зададена спрямо дадена става
	point(x,y,z)
	{
		return scene.worldToLocal(this.children[0].localToWorld(new THREE.Vector3(x,y,z)));
	}

}


class Pelvis extends Joint
{
	constructor(parentJoint)
	{
		super(parentJoint,null,[0,0,-20],[3,4,parentJoint.feminine?5.5:5],PelvisShape);
	}
}


class Torso extends Joint
{
	constructor(parentJoint)
	{
		super(parentJoint,[-2,4,0],[0,0,20],[5,17,10,parentJoint.feminine?10:80,parentJoint.feminine?520:380,parentJoint.feminine?0.8:0.9,parentJoint.feminine?0.25:0.2],TorsoShape);
	}
}


class Neck extends Joint
{
	constructor(parentJoint)
	{
		super(parentJoint,[0,15,0],[0,0,10],[2,parentJoint.feminine?5:4,2,45,60,1,0.2,0],LimbShape);
	}
}


class Head extends Joint
{
	constructor(parentJoint)
	{
		super(parentJoint,[1,3,0],null,[3,4,2.5],HeadShape);
	}
	
	nod(angle)
	{
		this.bendAngle = angle;
		this._turn();
	}
	
	_turn()
	{
		this.turnJoint(this.tiltAngle/2,-this.turnAngle/2,-this.bendAngle/2);
		this.parentJoint.turnJoint(this.tiltAngle/2,-this.turnAngle/2,-this.bendAngle/2);
	}
}


class Leg extends Joint
{
	constructor(parentJoint,leftOrRight)
	{
		super(parentJoint,[0,-3,4*leftOrRight],[0,180,200],[4,15,4,-70,220,1,0.4,2],LimbShape);
		this.leftOrRight = leftOrRight;
	}
	
	raise(angle)
	{
		this.bendAngle = angle;
		this._turn();
	}
	
	turn(angle,leftOrRight=this.leftOrRight)
	{
		this.turnAngle = -leftOrRight*angle;
		this._turn();
	}
	
	straddle(angle,leftOrRight=this.leftOrRight)
	{
		this.tiltAngle = -leftOrRight*angle;
		this._turn();
	}
}


class Knee extends Joint
{
	constructor(parentJoint)
	{
		super(parentJoint,null,null,[4,14,4,-40,290,0.65,0.25,1.5],LimbShape);
	}
	
	bend(angle)
	{
		this.bendAngle = -angle;
		this._turn();
	}
}


class Ankle extends Joint
{
	constructor(parentJoint)
	{
		super(parentJoint,null,[0,0,-90],[1,4,2],ShoeShape);
	}
	
	turn(angle,leftOrRight=this.parentJoint.parentJoint.leftOrRight)
	{
		this.tiltAngle = -leftOrRight*angle;
		this._turn();
	}
	
	tilt(angle,leftOrRight=-this.parentJoint.parentJoint.leftOrRight)
	{
		this.turnAngle = leftOrRight*angle;
		this._turn();
	}
}


class Arm extends Joint
{
	constructor(parentJoint,leftOrRight)
	{
		super(parentJoint,[0,14,leftOrRight*(parentJoint.feminine?5:6)],[-leftOrRight*10,leftOrRight*180,-leftOrRight*180],[3.5,11,2.5,-90,360,0.9,0.2,1.5],LimbShape);
		this.leftOrRight = leftOrRight;
	}
	
	raise(angle)
	{
		this.bendAngle = angle;
		this._turn();
	}
	
	turn(angle,leftOrRight=this.leftOrRight)
	{
		this.turnAngle = -leftOrRight*angle;
		this._turn();
	}
	
	straddle(angle,leftOrRight=this.leftOrRight)
	{
		this.tiltAngle = -leftOrRight*angle;
		this._turn();
	}
}


class Elbow extends Joint
{
	constructor(parentJoint)
	{
		super(parentJoint,null,null,[2.5,9,2,-40,150,0.5,0.45,1.1],LimbShape);
	}
}


class Wrist extends Joint
{
	constructor(parentJoint)
	{
		super(parentJoint,null,null,[1.2,2,3.5,-90,45,0.5,0.3,1/2],LimbShape);
	}
	
	turn(angle,leftOrRight=this.parentJoint.parentJoint.leftOrRight)
	{
		this.turnAngle = -leftOrRight*angle;
		this._turn();
	}
	
	tilt(angle,leftOrRight=-this.parentJoint.parentJoint.leftOrRight)
	{
		this.tiltAngle = leftOrRight*angle;
		this._turn();
	}
}


class Phalange extends Joint
{
	constructor(parentJoint,params)
	{
		super(parentJoint,null,null,params,LimbShape);
	}
	
}


class Fingers extends Phalange
{
	constructor(parentJoint)
	{
		super(parentJoint,[1.2,1.5,3.5,0,45,0.3,0.4,0.2]);
		
		this.sub_finger = new Phalange(this,[1.2,1,3.5,45,45,0.3,0.4,0.2]);
	}
	
	_turn()
	{
		this.turnJoint(this.tiltAngle/4,-this.turnAngle/4,this.bendAngle);
		this.sub_finger.turnJoint(this.tiltAngle/3,-this.turnAngle/3,this.bendAngle);
	}
}


// дефиниция на човече
class Human extends Joint
{
	constructor(feminine,height=1)
	{
		super(null,null,null,[1,1,1],THREE.Group);
	
		this.scale.set( height, height, height );
		
		this.feminine = feminine;
		
		this.pelvis = new Pelvis(this);
			this.torso = new Torso(this.pelvis);
			this.neck = new Neck(this.torso);
			this.head = new Head(this.neck);
			
		this.l_leg = new Leg(this.pelvis,LEFT);
			this.l_knee = new Knee(this.l_leg);
			this.l_ankle = new Ankle(this.l_knee);
			
		this.r_leg = new Leg(this.pelvis,RIGHT);
			this.r_knee = new Knee(this.r_leg);
			this.r_ankle = new Ankle(this.r_knee);
			
		this.l_arm = new Arm(this.torso,LEFT);
			this.l_elbow = new Elbow(this.l_arm);
			this.l_wrist = new Wrist(this.l_elbow);
			this.l_fingers = new Fingers(this.l_wrist);
			
		this.r_arm = new Arm(this.torso,RIGHT);
			this.r_elbow = new Elbow(this.r_arm);
			this.r_wrist = new Wrist(this.r_elbow);
			this.r_fingers = new Fingers(this.r_wrist);

		var s = 1.5/(0.5+height);
		this.head.scale.set( s, s, s );
		this.castShadow=true;
		this.receiveShadow=true;
		scene.add(this);
	}
		
	
	_turn()
	{
		this.turnJoint(this.tiltAngle,-this.turnAngle,-this.bendAngle,'YXZ');
	}
}


class Female extends Human
{
	constructor(){super(true,0.95);} 
}


class Male extends Human
{
	constructor(){super(false);} 
}


class Child extends Human
{
	constructor(){super(false,0.65);} 
}


createScene();