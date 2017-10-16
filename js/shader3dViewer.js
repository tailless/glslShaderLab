
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats, controls;
var camera, scene, renderer;

var objMesh;

var clock = new THREE.Clock();

var params = {
	wireframe: false,
	opacity: 1.0,
	lightIntensity: 1.0,
	shader: "Standard",
	geometry:"TorusKnot"
};

var uniforms = THREE.UniformsUtils.merge([
	THREE.UniformsLib['lights'],
	{
		u_time: { type: "f", value: 1.0 },
		u_resolution: { type: "v2", value: new THREE.Vector2() },
		u_mouse: { type: "v2", value: new THREE.Vector2() },
		u_alpha: { type: "f", value: 0.5 },
		u_lightIntensity : { type: "f", value: 1.0 },
		u_tImage : { type: "t", value: null },
		u_tDisplacement : { type: "t", value: null }
	}
])


var shaderOptions = {
	Standard: new THREE.MeshStandardMaterial({ color: 0x9988ff , transparent: true }),
	Gradiant: new THREE.ShaderMaterial( {
		uniforms: uniforms,
		vertexShader: document.getElementById( 'vertexShader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentShaderGradiant' ).textContent,
		transparent: true,
		lights : true
	} ),
	Quasi: new THREE.ShaderMaterial( {
		uniforms: uniforms,
		vertexShader: document.getElementById( 'vertexShader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentShader_Quasi' ).textContent,
		transparent: true,
		lights : true
	} ),
	Displacement: new THREE.ShaderMaterial( {
		uniforms: uniforms,
		vertexShader: document.getElementById( 'vertexShader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentDisplacement' ).textContent,
		transparent: true,
		lights : true
	} ),
	AshimaNoise: new THREE.ShaderMaterial( {
		uniforms: uniforms,
		vertexShader: document.getElementById( 'vertexShader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentAshimaNoise' ).textContent,
		transparent: true,
		lights : true
	} )

};

var texture = new THREE.TextureLoader().load( 'textures/shropshire.jpg' );
shaderOptions.Displacement.uniforms.u_tImage.value = texture;

texture = new THREE.TextureLoader().load( 'textures/disturb.jpg' );
texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
shaderOptions.Displacement.uniforms.u_tDisplacement.value = texture;

var geometryOptions = {
	Cube: new THREE.BoxGeometry( 30, 30, 30 ),
	Sphere: new THREE.SphereGeometry(30, 32, 16),
	Cone: new THREE.ConeGeometry( 30, 40, 32 ),
	Torus: new THREE.TorusGeometry( 30, 10, 16, 100 ),
	TorusKnot: new THREE.TorusKnotGeometry( 18, 8, 150, 20 ),
	Icosahedron : new THREE.IcosahedronGeometry(30),
	Octahedron:  new THREE.OctahedronGeometry(30),
	Dodecahedron : new THREE.DodecahedronGeometry(30)
};

var selectedShader = params.shader;


init();
animate();

function init() {

	container = document.getElementById( 'container' );

	//create camera
	camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.y = 60;

	scene = new THREE.Scene();

	// Lights
	var hemisphereLight = new THREE.HemisphereLight( 0x00aaff, 0xff43ff, 1 );
	hemisphereLight.position.set( 0, 100, 0 );
	//scene.add( hemisphereLight );

	var light = new THREE.PointLight(0xffffff, 1.0);
	light.position.set( 50, 50, -50 );
	//light.castShadow = true;
	scene.add(light);

	light = new THREE.PointLight(0xffffff, 1.0);
	light.position.set( -50, 50, -50 );
	//light.castShadow = true;
	scene.add(light);

	/* 3d object */
	objMesh = new THREE.Mesh( geometryOptions[params.geometry], shaderOptions[params.shader] );
	scene.add( objMesh );

	var surroundsMaterial = new THREE.MeshStandardMaterial( {
		map: null,
		roughnessMap: null,
		color: 0x222222,
		metalness: 0.0,
		roughness: 1.0,
		side: THREE.BackSide
	} );

	var geometry = new THREE.BoxBufferGeometry( 200, 200, 200 );
	var mesh = new THREE.Mesh( geometry, surroundsMaterial );
	mesh.position.y = 50;
	mesh.rotation.x = 0;
	//mesh.receiveShadow = true;
	scene.add( mesh );

	renderer = new THREE.WebGLRenderer( { antialias: false } );
	renderer.setPixelRatio( window.devicePixelRatio );

	//renderer.shadowMap.enabled = true;
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	container.appendChild( renderer.domElement );

	stats = new Stats();
	container.appendChild( stats.dom );

	controls = new THREE.OrbitControls( camera, renderer.domElement );

	// resize stuff
	onWindowResize();
	window.addEventListener( 'resize', onWindowResize, false );

	// update mouse position in uniforms
	document.onmousemove = function(e){
		uniforms.u_mouse.value.x = e.pageX
		uniforms.u_mouse.value.y = e.pageY
	}

	// contols
	var gui = new dat.GUI();

	gui.add( params, 'shader', Object.keys( shaderOptions ) );
	gui.add( params, 'geometry', Object.keys( geometryOptions ) );
	gui.add( params, 'wireframe', true, false );
	gui.add( params, 'opacity', 0, 1 );
	gui.add( params, 'lightIntensity', 0, 1 );
	//gui.add( params, 'renderMode', [ 'Renderer', 'Composer'] );
	gui.open();

}


function onWindowResize( event ) {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	uniforms.u_resolution.value.x = renderer.domElement.width;
	uniforms.u_resolution.value.y = renderer.domElement.height;
}

function animate() {

	renderer.animate( render );

}


function render() {
	stats.begin();
	var delta = clock.getDelta();
	uniforms.u_time.value += delta * 5;
	//uniforms.u_time.value += 0.05;

	uniforms.u_alpha.value = params.opacity;
	uniforms.u_lightIntensity.value = params.lightIntensity;

	/*
	// other ways of setting time uniform
	uniforms.u_time.value += delta * 5;
	uniforms.u_time.value = clock.elapsedTime;
	*/

	//animation
	objMesh.rotation.y = objMesh.rotation.x += delta * 0.5;

	//geometry
	if( objMesh.geometry !== geometryOptions[ params.geometry ] ) {
		objMesh.geometry = geometryOptions[params.geometry]
	}

	//material
	if(selectedShader !== params.shader ){
		selectedShader = params.shader
		objMesh.material = shaderOptions[ selectedShader ];
		//objMesh.material.needsUpdate = true;
	}

	objMesh.material.wireframe = params.wireframe;
	objMesh.material.opacity = params.opacity;


	renderer.render( scene, camera );
	stats.end();
}
