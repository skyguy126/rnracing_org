/** On-demand three.js turntable preview for an STL file. */
export async function initStlViewer(container: HTMLElement, src: string) {
	container.classList.add('is-loading');
	container.replaceChildren();
	const status = document.createElement('p');
	status.className = 'store-card__stl-status';
	status.textContent = 'Loading model…';
	container.appendChild(status);

	try {
		const THREE = await import('three');
		const { STLLoader } = await import('three/addons/loaders/STLLoader.js');
		const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');

		const geometry = await new STLLoader().loadAsync(src, (e) => {
			if (e.lengthComputable) status.textContent = `Loading model… ${Math.round((e.loaded / e.total) * 100)}%`;
		});
		geometry.computeVertexNormals();
		geometry.center();
		geometry.computeBoundingSphere();
		const radius = geometry.boundingSphere?.radius || 1;

		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(35, 1, radius / 100, radius * 20);
		camera.position.set(radius * 1.6, radius * 1.1, radius * 2.4);

		const mesh = new THREE.Mesh(
			geometry,
			new THREE.MeshStandardMaterial({ color: 0xc9ccd4, metalness: 0.55, roughness: 0.35 }),
		);
		// STLs are usually Z-up; stand it upright for three's Y-up world.
		mesh.rotation.x = -Math.PI / 2;
		scene.add(mesh);
		scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.4));
		const key = new THREE.DirectionalLight(0xffffff, 2.2);
		key.position.set(1, 2, 1.5);
		scene.add(key);

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.autoRotate = true;
		controls.autoRotateSpeed = 2;
		controls.enablePan = false;

		const resize = () => {
			const { clientWidth: w, clientHeight: h } = container;
			renderer.setSize(w, h, false);
			camera.aspect = w / Math.max(1, h);
			camera.updateProjectionMatrix();
		};
		new ResizeObserver(resize).observe(container);

		container.replaceChildren(renderer.domElement);
		container.classList.remove('is-loading');
		resize();
		renderer.setAnimationLoop(() => {
			controls.update();
			renderer.render(scene, camera);
		});
	} catch {
		status.textContent = 'Could not load the 3D preview.';
	}
}
