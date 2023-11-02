import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FlyControls } from "three/addons/controls/FlyControls.js";
import { Noise } from "noisejs";
import getColor from "./colorGradient";
import logoPng from "./path34436.png";

const logoDiv = document.createElement("img");
logoDiv.id = "logoDiv";
logoDiv.style.position = "absolute";
logoDiv.style.top = "0";
logoDiv.style.right = "0";
logoDiv.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
logoDiv.style.padding = "5px";
logoDiv.style.display = "block";
logoDiv.style.fontSize = "24px"; // Set font size
logoDiv.style.pointerEvents = "none"; // Make sure the info div does not block mouse events

// Create an Image object to calculate the aspect ratio
const img = new Image();
img.src = logoPng;

img.onload = function () {
	const aspectRatio = img.width / img.height;
	const maxWidth = 150; // Maximum width for logoDiv
	const maxHeight = 150; // Maximum height for logoDiv

	// Calculate new dimensions while preserving aspect ratio
	let newWidth, newHeight;
	if (img.width > img.height) {
		newWidth = Math.min(maxWidth, img.width);
		newHeight = newWidth / aspectRatio;
	} else {
		newHeight = Math.min(maxHeight, img.height);
		newWidth = newHeight * aspectRatio;
	}

	// Set dimensions and source for logoDiv
	logoDiv.style.width = `${newWidth}px`;
	logoDiv.style.height = `${newHeight}px`;
	logoDiv.src = logoPng;

	// Append logoDiv to the body
	document.body.appendChild(logoDiv);
};

const noise = new Noise(Math.random());

const worldParams = {
	width: 144,
	height: 108,
	maxHeight: 70,
	noiseFrequency: 1.9,
};

const { width, height, maxHeight, noiseFrequency } = worldParams;

const geometry = new THREE.BufferGeometry();
const vertices = [];
let minHeight = Infinity;

for (let i = 0; i < width; i++) {
	for (let j = 0; j < height; j++) {
		const x = i / width - 0.5; // 0 - 1
		const y = j / height - 0.5; // 0 - 1
		// All noise functions return values in the range of -1 to 1.
		const n = noise.simplex2(x * noiseFrequency, y * noiseFrequency);
		const normalNoise = (n + 1) / 2; // 0 - 1
		if (normalNoise < 0) throw new Error("normalNoise is less than 0");
		let z = normalNoise * maxHeight;
		minHeight = Math.min(minHeight, z);
		vertices.push(x * width, y * height, z);
	}
}

// Calculate scaling factors
const scaleX = 1 / Math.max(height, width);
const scaleY = 1 / Math.max(height, width);
const scaleZ = 1 / maxHeight;

const scaledVertices = [];
for (let i = 0; i < vertices.length; i += 3) {
	const x = vertices[i] * scaleX;
	const y = vertices[i + 1] * scaleY;
	const z = (vertices[i + 2] - minHeight) * scaleZ;
	scaledVertices.push(x, y, z);
}

const tVertices = new Float32Array(scaledVertices);
geometry.setAttribute("position", new THREE.BufferAttribute(tVertices, 3));

const colors = [];
for (let i = 0; i < scaledVertices.length; i += 3) {
	const height = scaledVertices[i + 2];
	const colorString = getColor((height * maxHeight) / (maxHeight - minHeight));
	const color = new THREE.Color(colorString);
	colors.push(color.r, color.g, color.b);
}

const tColors = new Float32Array(colors);
geometry.setAttribute("color", new THREE.BufferAttribute(tColors, 3));

// Define indices for the faces
const indices = [];
for (let i = 0; i < width - 1; i++) {
	for (let j = 0; j < height - 1; j++) {
		const a = i * height + j;
		const b = (i + 1) * height + j;
		const c = i * height + j + 1;
		const d = (i + 1) * height + j + 1;

		// Define two faces (triangles) for each grid cell
		indices.push(a, b, d);
		indices.push(a, d, c);
	}
}

const tIndices = new Uint32Array(indices);
geometry.setIndex(new THREE.BufferAttribute(tIndices, 1));
console.log(geometry);

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x3e83c7);

const axesHelper = new THREE.AxesHelper(1);
scene.add(axesHelper);

var camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);
camera.position.set(0, -1, 1.5);
camera.lookAt(new THREE.Vector3(0, 0, 0)); // Look at the center of the terrain

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// var controls = new FlyControls(camera, renderer.domElement);
// controls.movementSpeed = 0.1; // Adjust the movement speed to your preference
// controls.rollSpeed = Math.PI / 24; //
// controls.dragToLook = true;
// controls.autoForward = false;

var controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI;

var customMaterial = new THREE.ShaderMaterial({
	side: THREE.DoubleSide,
	vertexShader: `
        // Vertex Shader
        attribute vec3 color; // Declare a uniform variable to pass in the color from the JavaScript code

        varying vec3 vColor; // Declare a varying variable to pass color to the fragment shader
		varying vec4 vModelViewPosition;
		varying vec3 vViewPosition;

        void main() {
            vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * modelViewPosition;

            vViewPosition = -modelViewPosition.xyz; // In view space, camera position is (0, 0, 0)
			vModelViewPosition = modelViewPosition;
        	vColor = color; // Pass the color to the fragment shader
}
`,
	fragmentShader: `
        // Fragment Shader
        uniform vec3 ambientColor;
        uniform vec3 diffuseColor;
		uniform vec3 specularColor;
		uniform vec3 lightColor;
        uniform float shininess;

        varying vec3 vColor; // Receive the color from the vertex shader
		varying vec4 vModelViewPosition;
		varying vec3 vViewPosition;

        void main() {
         	vec3 ambient = ambientColor * vColor; // Ambient light contribution

        	vec3 lightDirection = normalize(vec3(0, 0, 1.0)); // Example light direction 
			vec3 n= normalize(cross(dFdx(vModelViewPosition.xyz), dFdy(vModelViewPosition.xyz)));
			vec3 normal = normalize(n);
            float diffuseFactor = max(dot(normal, lightDirection), 0.0); // Diffuse light contribution
            vec3 diffuse = diffuseColor * diffuseFactor * vColor;

		    vec3 viewDirection = normalize(-vViewPosition);
            vec3 halfwayDir = normalize(lightDirection + viewDirection);
            float specularFactor = pow(max(dot(normal, halfwayDir), 0.0), shininess);
            vec3 specular = specularColor * specularFactor * vColor;

            vec3 finalColor = ambient + diffuse + specular;

          	gl_FragColor = vec4(finalColor, 1.0); // Set the fragment color using the interpolated color from the vertex shader
        }
`,
	uniforms: {
		diffuseColor: { value: new THREE.Color(0xffffff) }, // Diffuse color of the object
		ambientColor: { value: new THREE.Color(0x333333) }, // Ambient color of the object
		specularColor: { value: new THREE.Color(0xffffff) },
		shininess: { value: 20 },
		lightColor: { value: new THREE.Color(0xffffff) },
	},
});

var mesh = new THREE.Mesh(geometry, customMaterial);
scene.add(mesh);

const whitePointGeometry = new THREE.SphereGeometry(0.003, 64, 64);
const whitePointMaterial = new THREE.MeshBasicMaterial({
	flatShading: false,
	color: 0xffffff,
});
const whitePoint = new THREE.Points(whitePointGeometry, whitePointMaterial);
scene.add(whitePoint);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Create infoDiv element
const infoDiv = document.createElement("div");
infoDiv.id = "infoDiv";
infoDiv.style.position = "absolute";
infoDiv.style.top = "0";
infoDiv.style.left = "0";
infoDiv.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
infoDiv.style.padding = "15px";
infoDiv.style.display = "none";
infoDiv.style.fontSize = "24px"; // Set font size
infoDiv.style.backgroundColor = "white"; // Set solid white background color
infoDiv.style.pointerEvents = "none"; // Make sure the info div does not block mouse events

// Append infoDiv to the body of the document
document.body.appendChild(infoDiv);

window.addEventListener("mousemove", (event) => {
	// Calculate mouse coordinates in normalized device coordinates (-1 to +1) for both components.
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	// Update the picking ray with the camera and mouse position.
	raycaster.setFromCamera(mouse, camera);

	// Calculate intersections with the terrain.
	const intersections = raycaster.intersectObject(mesh);

	if (intersections.length > 0) {
		const intersection = intersections[0];
		const position = intersection.point.clone();
		const info = {
			position,
			x: (position.x + 0.5) / scaleX,
			y: (position.y + 0.5) / scaleY,
			height: position.z / scaleZ + minHeight,
		};
		whitePoint.position.copy(position);

		// Update the content and position of the info div
		// TODO: properly distance unit
		infoDiv.innerHTML = ` 
							X: ${info.x.toFixed(2)} m<br>
							Y: ${info.y.toFixed(2)} m<br>
							Height: ${info.height.toFixed(2)} m
		`;
		infoDiv.style.left = `${event.clientX}px`;
		infoDiv.style.top = `${event.clientY}px`;

		// Show the info div
		infoDiv.style.display = "block";
	} else {
		// Hide the white point if there is no intersection with the terrain.
		whitePoint.position.set(0, -10, 0);
		// Hide the info div if there is no intersection with the terrain
		infoDiv.style.display = "none";
	}
});

// Add a mouseout event listener to hide the info div when mouse leaves the canvas
renderer.domElement.addEventListener("mouseout", () => {
	infoDiv.style.display = "none";
});

function animate() {
	requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
}

window.addEventListener("resize", function () {
	var width = window.innerWidth;
	var height = window.innerHeight;
	renderer.setSize(width, height);
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
});

animate();
