import * as THREE from 'three';

// Variables for interaction tracking
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
let scrollY = 0;
let isInteracting = false;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

// 1. Initialization
const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#f8fafc');
scene.fog = new THREE.FogExp2('#f8fafc', 0.03);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 8);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 2. Dynamic Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

const lightColors = [0x00aaff, 0xff00aa, 0xffaa00];
const lights = [];

lightColors.forEach((color) => {
    const light = new THREE.PointLight(color, 150, 20);
    scene.add(light);
    lights.push(light);
});

// 3. Creating the Holographic Glass Object
const geometry = new THREE.TorusKnotGeometry(1.4, 0.45, 256, 64);
const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 1.0,    
    ior: 1.55,            
    thickness: 1.5,       
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    transparent: true,
});

const mainObject = new THREE.Mesh(geometry, material);
mainObject.position.x = 2; 
scene.add(mainObject);

const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 500;
const posArray = new Float32Array(particlesCount * 3);
for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 15;
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.03,
    color: 0x64748b, 
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// 4. Event Listeners for Interaction
document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) / windowHalfX;
    mouseY = (event.clientY - windowHalfY) / windowHalfY;
});

window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
});

document.addEventListener('mousedown', () => isInteracting = true);
document.addEventListener('mouseup', () => isInteracting = false);
document.addEventListener('touchstart', () => isInteracting = true, {passive: true});
document.addEventListener('touchend', () => isInteracting = false);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 5. Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Interaction 1: Parallax Smoothing
    targetX = mouseX * 0.5; 
    targetY = mouseY * 0.5;

    mainObject.rotation.y += 0.05 * (targetX - mainObject.rotation.y);
    mainObject.rotation.x += 0.05 * (targetY - mainObject.rotation.x);
    particlesMesh.rotation.y += 0.02 * (targetX * 0.5 - particlesMesh.rotation.y);
    particlesMesh.rotation.x += 0.02 * (targetY * 0.5 - particlesMesh.rotation.x);

    // Interaction 2: Scroll Animation
    const scrollRatio = scrollY * 0.002;
    const targetPosX = 2 - scrollRatio * 4; 
    const targetPosY = Math.sin(scrollRatio * Math.PI) * -1; 

    mainObject.position.x += 0.05 * (targetPosX - mainObject.position.x);
    mainObject.position.y += 0.05 * (targetPosY - mainObject.position.y);
    mainObject.rotation.z = scrollRatio * 2;

    // Interaction 3: Click Deformation
    const targetScale = isInteracting ? 1.3 : 1.0;
    const targetLightIntensity = isInteracting ? 400 : 150;
    const targetSpeed = isInteracting ? 2.0 : 0.5;

    mainObject.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
    mainObject.rotation.y += 0.005 * targetSpeed;
    particlesMesh.rotation.y -= 0.001 * targetSpeed;

    lights.forEach((light, i) => {
        const speedOffset = i * (Math.PI * 2 / 3);
        light.position.x = Math.sin((elapsedTime * 0.8) + speedOffset) * 3;
        light.position.y = Math.cos((elapsedTime * 0.5) + speedOffset) * 3;
        light.position.z = Math.sin((elapsedTime * 0.6) + speedOffset) * 2;
        
        light.intensity += 0.1 * (targetLightIntensity - light.intensity);
    });

    renderer.render(scene, camera);
}

animate();