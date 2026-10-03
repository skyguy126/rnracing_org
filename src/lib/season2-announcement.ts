import type { CreateTypes } from 'canvas-confetti';
import type * as THREE_NS from 'three';

const EMBLEM_URL = '/season-2/season-2-emblem-transparent.svg';
const MUSIC_URL = '/season-2/right-above-it.mp3';
const SVG_W = 1231;
const SVG_H = 975;
const EXTRUDE_DEPTH = 96;
const CAMERA_FOV = 38;
const CAMERA_Z = 10;
const CONFETTI_COLORS = ['#fefefe', '#ffffff', '#f3121d', '#fbdc19', '#df9c4c', '#3b82f6', '#93c5fd'];

type ThreeModule = typeof THREE_NS;
type GsapModule = typeof import('gsap').default;
type Disposable = { dispose: () => void };

function prefersReducedMotion() {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function cappedPixelRatio() {
	return Math.min(window.devicePixelRatio || 1, 1.75);
}

function wait(ms: number) {
	return new Promise<void>((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

function nextFrame() {
	return new Promise<void>((resolve) => {
		requestAnimationFrame(() => resolve());
	});
}

async function loadThree() {
	const load = () =>
		Promise.all([import('three'), import('three/addons/loaders/SVGLoader.js')] as const);
	try {
		return await load();
	} catch (error) {
		await wait(500);
		try {
			return await load();
		} catch {
			throw error;
		}
	}
}

function watchNavOffset() {
	const header = document.querySelector<HTMLElement>('.site-header');

	const apply = () => {
		const height = header?.getBoundingClientRect().height ?? 0;
		const top = Math.max(0, Math.round(height) - 1);
		document.documentElement.style.setProperty('--s2-nav-bottom', `${top}px`);
	};

	apply();
	const observer = new ResizeObserver(apply);
	if (header) observer.observe(header);
	window.addEventListener('resize', apply);

	return () => {
		observer.disconnect();
		window.removeEventListener('resize', apply);
	};
}

function targetArtPixels(viewportWidth: number, viewportHeight: number, aspect: number) {
	const compact = viewportWidth < 900 || viewportHeight < 560;
	let width = compact
		? viewportWidth * 0.86
		: Math.min(Math.min(viewportWidth, viewportHeight) * 0.72, 900);
	let height = width / aspect;
	const maxWidth = viewportWidth * 0.9;
	const maxHeight = viewportHeight * 0.76;

	if (width > maxWidth) {
		width = maxWidth;
		height = width / aspect;
	}
	if (height > maxHeight) {
		height = maxHeight;
		width = height * aspect;
	}

	return width;
}

function svgDocumentAtWidth(svgText: string, width: number) {
	const height = Math.max(1, Math.round(width * (SVG_H / SVG_W)));
	const sized = svgText.replace(/<svg\b([^>]*)>/i, (_match, attrs: string) => {
		const cleaned = attrs.replace(/\swidth="[^"]*"/gi, '').replace(/\sheight="[^"]*"/gi, '');
		return `<svg${cleaned} width="${width}" height="${height}">`;
	});
	return { sized, height };
}

function loadImage(url: string) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.decoding = 'async';
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error('Could not load the Season 2 emblem'));
		image.src = url;
	});
}

async function rasterizeEmblem(svgText: string) {
	const dpr = cappedPixelRatio();
	const width = Math.min(2048, Math.max(1280, Math.round(Math.min(window.innerWidth, 980) * dpr)));
	const { sized, height } = svgDocumentAtWidth(svgText, width);
	const blob = new Blob([sized], { type: 'image/svg+xml;charset=utf-8' });
	const url = URL.createObjectURL(blob);

	try {
		const image = await loadImage(url);
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext('2d', { alpha: true });
		if (!context) throw new Error('Could not rasterize the Season 2 emblem');
		context.clearRect(0, 0, width, height);
		context.imageSmoothingEnabled = true;
		context.imageSmoothingQuality = 'high';
		context.drawImage(image, 0, 0, width, height);
		const pixels = context.getImageData(0, 0, width, height);
		const data = pixels.data;
		for (let i = 0; i < data.length; i += 4) {
			if (data[i + 3] < 16) continue;
			const max = Math.max(data[i], data[i + 1], data[i + 2]);
			if (max >= 36) continue;
			const lift = (16 * (36 - max)) / 36;
			data[i] = Math.min(255, data[i] + lift);
			data[i + 1] = Math.min(255, data[i + 1] + lift);
			data[i + 2] = Math.min(255, data[i + 2] + lift);
		}
		context.putImageData(pixels, 0, 0);
		return canvas;
	} finally {
		URL.revokeObjectURL(url);
	}
}

function paintWoodGrain(size = 512) {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Could not paint the wood texture');

	context.fillStyle = '#a86b3c';
	context.fillRect(0, 0, size, size);

	for (let y = 0; y < size; y++) {
		const wave = Math.sin(y * 0.045) * 0.55 + Math.sin(y * 0.12 + 1.4) * 0.3 + Math.sin(y * 0.31) * 0.15;
		const tone = 148 + wave * 42;
		context.fillStyle = `rgb(${Math.round(tone + 38)}, ${Math.round(tone * 0.62)}, ${Math.round(tone * 0.32)})`;
		context.fillRect(0, y, size, 1);
	}

	for (let band = 0; band < 22; band++) {
		const y = (band * 23 + (band % 5) * 4) % size;
		context.strokeStyle = `rgba(72, 36, 16, ${0.18 + (band % 4) * 0.07})`;
		context.lineWidth = 1 + (band % 3);
		context.beginPath();
		context.moveTo(0, y);
		for (let x = 0; x <= size; x += 24) {
			context.lineTo(x, y + Math.sin(x * 0.02 + band) * 4);
		}
		context.stroke();
	}

	return canvas;
}

function woodBackingCanvas(emblem: HTMLCanvasElement, grain: HTMLCanvasElement) {
	const canvas = document.createElement('canvas');
	canvas.width = emblem.width;
	canvas.height = emblem.height;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Could not paint the wood backing');
	context.drawImage(grain, 0, 0, canvas.width, canvas.height);
	context.globalCompositeOperation = 'destination-in';
	context.drawImage(emblem, 0, 0);
	return canvas;
}

function geometryIsUsable(geometry: THREE_NS.BufferGeometry) {
	geometry.computeBoundingBox();
	const box = geometry.boundingBox;
	if (!box) return false;
	const size = box.getSize(box.min.clone());
	return [box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z, size.x, size.y].every(
		(value) => Number.isFinite(value),
	);
}

export function initSeason2Announcement() {
	const banner = document.querySelector<HTMLButtonElement>('[data-s2-banner]');
	const overlay = document.querySelector<HTMLElement>('[data-s2-overlay]');
	if (!banner || !overlay || banner.dataset.s2Bound === 'true') return;

	banner.dataset.s2Bound = 'true';
	watchNavOffset();

	banner.addEventListener('click', () => {
		if (banner.disabled) return;
		banner.disabled = true;
		const reduced = prefersReducedMotion();
		void launch(overlay, reduced).finally(() => {
			banner.disabled = false;
		});
	});
}

async function launch(overlay: HTMLElement, reduced: boolean) {
	const session = createSession(overlay, reduced);
	session.open();
	session.startMusic();
	await nextFrame();

	try {
		const gsap = (await import('gsap')).default;
		if (session.dismissed) return;

		try {
			await session.playWebGL(gsap);
		} catch (error) {
			if (session.dismissed) return;
			console.warn('Season 2 WebGL reveal failed; using the SVG fallback.', error);
			session.clearWebGL();
			await session.playCss(gsap);
		}

		if (!session.dismissed) await session.waitForClose();
		await session.fadeOut(280);
	} finally {
		session.destroy();
	}
}

function createSession(overlay: HTMLElement, reduced: boolean) {
	const webglCanvas = overlay.querySelector<HTMLCanvasElement>('[data-s2-webgl]');
	const confettiCanvas = overlay.querySelector<HTMLCanvasElement>('[data-s2-confetti]');
	const fallback = overlay.querySelector<HTMLElement>('[data-s2-fallback]');
	const coin = overlay.querySelector<HTMLElement>('[data-s2-coin]');
	const caption = overlay.querySelector<HTMLElement>('[data-s2-caption]');
	const dismiss = overlay.querySelector<HTMLButtonElement>('[data-s2-dismiss]');
	const faces = Array.from(overlay.querySelectorAll<HTMLImageElement>('[data-s2-face]'));

	if (!webglCanvas || !confettiCanvas || !fallback || !coin || !caption || !dismiss) {
		throw new Error('Season 2 announcement markup is incomplete');
	}

	const scrollY = window.scrollY;
	const inertNodes: HTMLElement[] = [];
	let disposed = false;
	let dismissed = false;
	let fading = false;
	let timeline: { kill: () => void } | null = null;
	let finishTimeline: (() => void) | null = null;
	let cancelPause: (() => void) | null = null;
	let renderer: THREE_NS.WebGLRenderer | null = null;
	let shooter: CreateTypes | null = null;
	const delayed: Array<{ kill: () => void }> = [];
	const loops: Array<{ kill: () => void }> = [];
	const trash: Disposable[] = [];
	let music: HTMLAudioElement | null = null;
	let musicFrame = 0;

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			event.preventDefault();
			requestClose();
			return;
		}

		if ([' ', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) {
			if (event.target === dismiss && (event.key === ' ' || event.key === 'Enter')) return;
			event.preventDefault();
		}
	};

	const preventGesture = (event: Event) => {
		event.preventDefault();
	};

	function stopScheduledBursts() {
		while (delayed.length) delayed.pop()?.kill();
	}

	function stopLoops() {
		while (loops.length) loops.pop()?.kill();
	}

	function rampMusic(to: number, ms: number) {
		const audio = music;
		if (!audio) return;
		const from = audio.volume;
		const start = performance.now();
		if (musicFrame) cancelAnimationFrame(musicFrame);
		const step = (now: number) => {
			if (music !== audio) return;
			const t = ms <= 0 ? 1 : Math.min(1, (now - start) / ms);
			const eased = 1 - (1 - t) * (1 - t);
			audio.volume = from + (to - from) * eased;
			if (t < 1) musicFrame = requestAnimationFrame(step);
			else musicFrame = 0;
		};
		musicFrame = requestAnimationFrame(step);
	}

	function startMusic() {
		const audio = new Audio(MUSIC_URL);
		audio.preload = 'auto';
		audio.volume = 0;
		music = audio;
		void audio.play().then(
			() => {
				if (music !== audio || dismissed) return;
				rampMusic(0.82, reduced ? 500 : 1700);
			},
			(error: unknown) => {
				console.warn('Season 2 music could not play.', error);
			},
		);
	}

	function stopMusic() {
		const audio = music;
		if (!audio) return;
		rampMusic(0, reduced ? 80 : 240);
		window.setTimeout(() => {
			if (music !== audio) return;
			audio.pause();
		}, reduced ? 100 : 260);
	}

	function requestClose() {
		if (disposed || dismissed) return;
		dismissed = true;
		stopScheduledBursts();
		stopLoops();
		stopMusic();
		timeline?.kill();
		finishTimeline?.();
		cancelPause?.();
	}

	function open() {
		for (const child of document.body.children) {
			if (!(child instanceof HTMLElement) || child === overlay || child.hasAttribute('inert')) continue;
			child.setAttribute('inert', '');
			inertNodes.push(child);
		}

		document.documentElement.classList.add('s2-scroll-lock');
		overlay.hidden = false;
		overlay.classList.add('is-open');
		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('wheel', preventGesture, { passive: false });
		window.addEventListener('touchmove', preventGesture, { passive: false });
		overlay.addEventListener('click', requestClose);
		window.setTimeout(() => dismiss.focus(), 30);
	}

	function track<T extends Disposable>(item: T) {
		trash.push(item);
		return item;
	}

	function clearWebGL() {
		if (renderer) {
			const current = renderer;
			renderer = null;
			current.setAnimationLoop(null);
			current.dispose();
		}
		while (trash.length) trash.pop()?.dispose();
		webglCanvas.hidden = true;
	}

	async function playWebGL(gsap: GsapModule) {
		webglCanvas.hidden = false;
		webglCanvas.style.opacity = '';
		const [THREE, { SVGLoader }] = await loadThree();
		const response = await fetch(EMBLEM_URL);
		if (!response.ok) throw new Error('Could not fetch the Season 2 emblem');
		const svgText = await response.text();
		if (dismissed) return;

		const [textureCanvas] = await Promise.all([
			rasterizeEmblem(svgText),
			wait(reduced ? 20 : 160),
		]);
		if (dismissed) return;

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.05, 100);
		camera.position.z = CAMERA_Z;
		camera.lookAt(0, 0, 0);

		let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
		try {
			renderer = new THREE.WebGLRenderer({
				canvas: webglCanvas,
				alpha: true,
				antialias: true,
				powerPreference: 'high-performance',
			});
			gl = renderer.getContext();
		} catch (error) {
			renderer = null;
			throw error;
		}
		if (!renderer || !gl || gl.isContextLost()) {
			throw new Error('WebGL is unavailable');
		}

		renderer.setClearColor(0x000000, 0);
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.toneMapping = THREE.NoToneMapping;
		renderer.setPixelRatio(cappedPixelRatio());

		const onContextLost = (event: Event) => {
			event.preventDefault();
			requestClose();
		};
		webglCanvas.addEventListener('webglcontextlost', onContextLost, { once: true });

		const emblem = buildEmblem(THREE, SVGLoader, svgText, textureCanvas);
		scene.add(emblem.fit);
		scene.add(new THREE.AmbientLight(0xffffff, 0.85));
		const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
		keyLight.position.set(4, 6, 8);
		scene.add(keyLight);
		const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.15);
		rimLight.position.set(-6, 1.2, 3);
		scene.add(rimLight);

		const viewport = () => ({
			width: overlay.clientWidth || window.innerWidth,
			height: Math.max(overlay.clientHeight || window.innerHeight, 1),
		});

		const resize = () => {
			if (!renderer) return;
			const { width, height } = viewport();
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			renderer.setPixelRatio(cappedPixelRatio());
			renderer.setSize(width, height, false);
			const visibleHeight = visibleHeightAtOrigin(camera);
			const visibleWidth = visibleHeight * camera.aspect;
			const artWidth = targetArtPixels(width, height, emblem.aspect);
			const worldWidth = (artWidth / width) * visibleWidth;
			emblem.fit.scale.setScalar(worldWidth / emblem.contentWidth);
		};

		resize();
		renderer.setAnimationLoop(() => {
			renderer?.render(scene, camera);
		});
		window.addEventListener('resize', resize);
		trash.push({
			dispose: () => {
				window.removeEventListener('resize', resize);
				webglCanvas.removeEventListener('webglcontextlost', onContextLost);
			},
		});

		if (!reduced) {
			try {
				await armConfetti();
			} catch (error) {
				console.warn('Season 2 confetti failed to start.', error);
			}
		}

		gsap.set(caption, { autoAlpha: 0 });

		await runTimeline(gsap, (tl) => {
			const pose = restingPose(camera, emblem.fit.scale.x);

			if (reduced) {
				emblem.spin.scale.setScalar(pose.scale * 0.94);
				emblem.spin.position.set(0, pose.y, 0);
				webglCanvas.style.opacity = '0';
				tl.to(
					emblem.spin.scale,
					{ x: pose.scale, y: pose.scale, z: pose.scale, duration: 0.35, ease: 'power1.out' },
					0,
				);
				tl.to(webglCanvas, { opacity: 1, duration: 0.35, ease: 'power1.out' }, 0);
				tl.to(caption, { autoAlpha: 1, duration: 0.4, ease: 'power1.out' }, 0.12);
				return;
			}

			const fitScale = Math.max(emblem.fit.scale.x, 0.0001);
			const visibleHeight = visibleHeightAtOrigin(camera);
			const startScale = 0.4;
			const worldHeight = SVG_H * fitScale * startScale;
			const startY = -(visibleHeight / 2 + worldHeight / 2 + visibleHeight * 0.08) / fitScale;
			const overshootY = (visibleHeight * 0.03) / fitScale;

			emblem.spin.scale.setScalar(startScale);
			emblem.spin.position.y = startY;
			emblem.spin.rotation.y = 0;
			emblem.sheen.visible = false;

			tl.to(
				emblem.spin.position,
				{
					keyframes: [
						{ y: overshootY, duration: 0.48, ease: 'power3.out' },
						{ y: 0, duration: 0.24, ease: 'power2.out' },
					],
				},
				0,
			);
			tl.to(emblem.spin.scale, { x: 1, y: 1, z: 1, duration: 0.72, ease: 'power3.out' }, 0);
			tl.to(emblem.spin.rotation, { y: Math.PI * 8, duration: 3.2, ease: 'power2.out' }, 0.48);
			tl.to(
				emblem.spin.position,
				{
					keyframes: [
						{ x: 0, y: pose.y + pose.bob, duration: 0.36, ease: 'power2.out' },
						{ x: 0, y: pose.y, duration: 0.34, ease: 'back.out(1.7)' },
					],
				},
				3.72,
			);
			tl.to(emblem.spin.rotation, { x: 0.2, z: 0, duration: 0.7, ease: 'back.out(1.4)' }, 3.72);
			tl.to(
				emblem.spin.scale,
				{ x: pose.scale, y: pose.scale, z: pose.scale, duration: 0.7, ease: 'power2.out' },
				3.72,
			);
			tl.to(caption, { autoAlpha: 1, duration: 0.75, ease: 'power1.out' }, 4.15);
			tl.call(() => startWebGLIdle(gsap, emblem, pose), [], 4.45);
			scheduleConfetti(gsap);
		});
	}

	function buildEmblem(
		THREE: ThreeModule,
		SVGLoader: typeof import('three/addons/loaders/SVGLoader.js').SVGLoader,
		svgText: string,
		textureCanvas: HTMLCanvasElement,
	) {
		if (!renderer) throw new Error('Renderer missing');

		const parsed = new SVGLoader().parse(svgText);
		const texture = track(
			new THREE.CanvasTexture(textureCanvas),
		);
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
		texture.needsUpdate = true;

		const grain = paintWoodGrain();
		const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
		const sideMap = track(new THREE.CanvasTexture(grain));
		sideMap.colorSpace = THREE.SRGBColorSpace;
		sideMap.wrapS = THREE.RepeatWrapping;
		sideMap.wrapT = THREE.RepeatWrapping;
		sideMap.repeat.set(1 / 220, 1 / 96);
		sideMap.anisotropy = anisotropy;
		sideMap.needsUpdate = true;

		const backingMap = track(new THREE.CanvasTexture(woodBackingCanvas(textureCanvas, grain)));
		backingMap.colorSpace = THREE.SRGBColorSpace;
		backingMap.anisotropy = anisotropy;
		backingMap.needsUpdate = true;

		const capMaterial = track(
			new THREE.MeshBasicMaterial({
				colorWrite: false,
				depthWrite: false,
				side: THREE.DoubleSide,
			}),
		);
		const sideMaterial = track(
			new THREE.MeshStandardMaterial({
				map: sideMap,
				roughness: 0.82,
				metalness: 0.04,
				side: THREE.DoubleSide,
			}),
		);
		const backingMaterial = track(
			new THREE.MeshStandardMaterial({
				map: backingMap,
				transparent: true,
				roughness: 0.78,
				metalness: 0.04,
				side: THREE.BackSide,
			}),
		);
		const faceMaterial = track(
			new THREE.MeshBasicMaterial({
				map: texture,
				transparent: true,
				depthWrite: false,
				side: THREE.FrontSide,
				toneMapped: false,
			}),
		);

		const extrusion = new THREE.Group();
		const extrudeSettings: THREE_NS.ExtrudeGeometryOptions = {
			depth: EXTRUDE_DEPTH,
			bevelEnabled: true,
			bevelThickness: 6,
			bevelSize: 2.2,
			bevelOffset: 0,
			bevelSegments: 2,
			curveSegments: 8,
			steps: 1,
		};

		let meshCount = 0;
		for (const path of parsed.paths) {
			let shapes: THREE_NS.Shape[] = [];
			try {
				shapes = path.toShapes();
			} catch {
				continue;
			}

			for (const shape of shapes) {
				let geometry: THREE_NS.ExtrudeGeometry;
				try {
					geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
				} catch {
					continue;
				}
				if (!geometryIsUsable(geometry)) {
					geometry.dispose();
					continue;
				}
				track(geometry);
				const hasSides = geometry.groups.some((group) => group.materialIndex === 1);
				const mesh = new THREE.Mesh(geometry, hasSides ? [capMaterial, sideMaterial] : sideMaterial);
				mesh.renderOrder = 0;
				extrusion.add(mesh);
				meshCount += 1;
			}
		}

		if (!meshCount) throw new Error('The emblem extrusion produced no geometry');

		extrusion.scale.y = -1;
		extrusion.position.set(-SVG_W / 2, SVG_H / 2, -EXTRUDE_DEPTH / 2);
		extrusion.updateWorldMatrix(true, true);

		const bounds = new THREE.Box3().setFromObject(extrusion);
		const boundsSize = bounds.getSize(new THREE.Vector3());
		if (!Number.isFinite(boundsSize.x) || boundsSize.x <= 0 || boundsSize.y <= 0) {
			throw new Error('The emblem bounds are invalid');
		}

		const front = new THREE.Mesh(track(new THREE.PlaneGeometry(SVG_W, SVG_H)), faceMaterial);
		front.position.z = EXTRUDE_DEPTH / 2 + 1.2;
		front.renderOrder = 2;

		const back = new THREE.Mesh(track(new THREE.PlaneGeometry(SVG_W, SVG_H)), backingMaterial);
		back.position.z = -(EXTRUDE_DEPTH / 2 + 1.2);
		back.renderOrder = 1;

		const sweep = { value: 0.18 };
		const sheen = new THREE.Mesh(
			track(new THREE.PlaneGeometry(SVG_W, SVG_H)),
			track(
				new THREE.ShaderMaterial({
					transparent: true,
					depthWrite: false,
					blending: THREE.AdditiveBlending,
					toneMapped: false,
					uniforms: {
						uEmblem: { value: texture },
						uSweep: sweep,
					},
					vertexShader: `
						varying vec2 vUv;
						void main() {
							vUv = uv;
							gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
						}
					`,
					fragmentShader: `
						uniform sampler2D uEmblem;
						uniform float uSweep;
						varying vec2 vUv;
						void main() {
							float mask = texture2D(uEmblem, vUv).a;
							float coord = vUv.x + (vUv.y - 0.5) * 0.16;
							float dist = abs(coord - uSweep);
							float band = pow(smoothstep(0.115, 0.0, dist), 0.75);
							float strength = band * mask * 0.52;
							if (strength < 0.02) discard;
							gl_FragColor = vec4(vec3(strength), strength);
						}
					`,
				}),
			),
		);
		sheen.position.z = EXTRUDE_DEPTH / 2 + 2.6;
		sheen.userData.sweep = sweep;
		sheen.visible = false;
		sheen.renderOrder = 3;

		const spin = new THREE.Group();
		spin.add(extrusion, front, back, sheen);
		const fit = new THREE.Group();
		fit.add(spin);

		return {
			fit,
			spin,
			sheen,
			contentWidth: boundsSize.x,
			aspect: boundsSize.x / boundsSize.y,
		};
	}

	function restingPose(camera: THREE_NS.PerspectiveCamera, fitScale: number) {
		const width = overlay.clientWidth || window.innerWidth;
		const height = Math.max(overlay.clientHeight || window.innerHeight, 1);
		const compact = width < 900 || height < 560;
		const scale = Math.max(fitScale, 0.0001);
		const visibleHeight = visibleHeightAtOrigin(camera);
		return {
			x: 0,
			y: (visibleHeight * (compact ? 0.045 : 0.1)) / scale,
			bob: (visibleHeight * 0.018) / scale,
			scale: compact ? 0.64 : 0.8,
		};
	}

	function startWebGLIdle(
		gsap: GsapModule,
		emblem: { spin: THREE_NS.Group; sheen: THREE_NS.Mesh },
		pose: { y: number; bob: number },
	) {
		if (dismissed) return;
		emblem.sheen.visible = true;
		const baseY = emblem.spin.rotation.y;
		loops.push(
			gsap.to(emblem.spin.position, {
				y: pose.y + pose.bob,
				duration: 1.05,
				yoyo: true,
				repeat: -1,
				ease: 'sine.inOut',
			}),
			gsap.to(emblem.spin.rotation, {
				y: baseY + 0.3,
				x: 0.38,
				z: 0,
				duration: 1.45,
				yoyo: true,
				repeat: -1,
				ease: 'sine.inOut',
			}),
			gsap.fromTo(
				emblem.sheen.userData.sweep as { value: number },
				{ value: 0.2 },
				{
					value: 0.8,
					duration: 1.7,
					yoyo: true,
					repeat: -1,
					ease: 'sine.inOut',
				},
			),
		);
	}

	function visibleHeightAtOrigin(camera: THREE_NS.PerspectiveCamera) {
		return 2 * Math.tan(THREE_NS_DEG(camera.fov) / 2) * camera.position.z;
	}

	async function armConfetti() {
		const confettiModule = await import('canvas-confetti');
		const confetti = confettiModule.default;
		shooter = confetti.create(confettiCanvas, {
			resize: true,
			useWorker: true,
			disableForReducedMotion: true,
		});
	}

	function scheduleConfetti(gsap: GsapModule) {
		if (!shooter) return;
		const powers = [1.05, 0.82, 1.2, 0.74, 1.05, 0.7, 0.95, 0.78];
		let index = 0;
		const tick = () => {
			if (dismissed || !shooter) return;
			fireConfetti(powers[index % powers.length]);
			index += 1;
		};
		delayed.push(
			gsap.delayedCall(0.66, () => {
				if (dismissed) return;
				tick();
				loops.push(gsap.to({}, { duration: 0.38, repeat: -1, onRepeat: tick }));
			}),
		);
	}

	function fireConfetti(power: number) {
		if (!shooter || dismissed) return;
		const count = Math.round(56 * power);
		const velocity = 46 + 18 * power;
		shooter({
			particleCount: count,
			angle: 64,
			spread: 62,
			startVelocity: velocity,
			origin: { x: 0.04, y: 0.98 },
			gravity: 0.92,
			decay: 0.915,
			ticks: 320,
			scalar: 0.9,
			drift: 0.4,
			colors: CONFETTI_COLORS,
			shapes: ['square', 'circle'],
			disableForReducedMotion: true,
		});
		shooter({
			particleCount: count,
			angle: 116,
			spread: 62,
			startVelocity: velocity,
			origin: { x: 0.96, y: 0.98 },
			gravity: 0.92,
			decay: 0.915,
			ticks: 320,
			scalar: 0.9,
			drift: -0.4,
			colors: CONFETTI_COLORS,
			shapes: ['square', 'circle'],
			disableForReducedMotion: true,
		});
	}

	async function playCss(gsap: GsapModule) {
		webglCanvas.hidden = true;
		for (const face of faces) {
			if (!face.getAttribute('src')) face.src = EMBLEM_URL;
		}
		fallback.hidden = false;
		if (!reduced) {
			try {
				await armConfetti();
			} catch (error) {
				console.warn('Season 2 confetti failed to start.', error);
			}
		}
		await wait(reduced ? 20 : 80);
		if (dismissed) return;

		gsap.set(caption, { autoAlpha: 0 });
		const compact = window.innerWidth < 900 || window.innerHeight < 560;
		const restY = -window.innerHeight * (compact ? 0.04 : 0.08);
		const restScale = compact ? 0.64 : 0.8;

		await runTimeline(gsap, (tl) => {
			if (reduced) {
				gsap.set(coin, {
					opacity: 0,
					scale: restScale * 0.94,
					y: restY,
					x: 0,
					rotationY: 0,
					transformPerspective: 1000,
				});
				tl.to(coin, { opacity: 1, scale: restScale, duration: 0.35, ease: 'power1.out' }, 0);
				tl.to(caption, { autoAlpha: 1, duration: 0.4, ease: 'power1.out' }, 0.12);
				return;
			}

			gsap.set(coin, {
				y: window.innerHeight * 0.78,
				scale: 0.4,
				rotationY: 0,
				transformPerspective: 1000,
				transformOrigin: '50% 50%',
			});
			tl.to(
				coin,
				{
					keyframes: [
						{ y: -window.innerHeight * 0.03, duration: 0.48, ease: 'power3.out' },
						{ y: 0, duration: 0.24, ease: 'power2.out' },
					],
				},
				0,
			);
			tl.to(coin, { scale: 1, duration: 0.72, ease: 'power3.out' }, 0);
			tl.to(coin, { rotationY: 360 * 4, duration: 3.2, ease: 'power2.out' }, 0.48);
			tl.to(
				coin,
				{
					keyframes: [
						{ x: 0, y: restY - 12, rotationX: 14, rotationZ: 0, duration: 0.36, ease: 'power2.out' },
						{ x: 0, y: restY, rotationX: 10, rotationZ: 0, duration: 0.34, ease: 'back.out(1.7)' },
					],
				},
				3.72,
			);
			tl.to(coin, { scale: restScale, duration: 0.7, ease: 'power2.out' }, 3.72);
			tl.to(caption, { autoAlpha: 1, duration: 0.75, ease: 'power1.out' }, 4.15);
			scheduleConfetti(gsap);
			tl.call(() => {
				if (dismissed) return;
				coin.classList.add('is-idle');
				loops.push(
					gsap.to(coin, {
						y: restY - window.innerHeight * 0.015,
						rotationY: '+=17',
						duration: 1.15,
						yoyo: true,
						repeat: -1,
						ease: 'sine.inOut',
					}),
				);
			}, [], 4.45);
		});
	}

	function runTimeline(gsap: GsapModule, build: (tl: ReturnType<GsapModule['timeline']>) => void) {
		return new Promise<void>((resolve) => {
			let settled = false;
			const done = () => {
				if (settled) return;
				settled = true;
				finishTimeline = null;
				resolve();
			};
			const tl = gsap.timeline({ onComplete: done });
			timeline = tl;
			finishTimeline = () => {
				tl.kill();
				done();
			};
			build(tl);
			if (dismissed) finishTimeline();
		});
	}

	function waitForClose() {
		return new Promise<void>((resolve) => {
			if (dismissed) {
				resolve();
				return;
			}
			cancelPause = () => {
				cancelPause = null;
				resolve();
			};
		});
	}

	function fadeOut(ms: number) {
		if (fading) return Promise.resolve();
		fading = true;
		const duration = reduced ? Math.min(ms, 180) : ms;
		overlay.classList.toggle('is-quick', duration < 400);

		return new Promise<void>((resolve) => {
			let settled = false;
			const done = () => {
				if (settled) return;
				settled = true;
				resolve();
			};
			const onEnd = (event: TransitionEvent) => {
				if (event.target === overlay && event.propertyName === 'opacity') done();
			};
			overlay.addEventListener('transitionend', onEnd);
			overlay.classList.add('is-leaving');
			window.setTimeout(done, duration + 80);
		});
	}

	function destroy() {
		if (disposed) return;
		disposed = true;
		stopScheduledBursts();
		stopLoops();
		timeline?.kill();
		try {
			shooter?.reset();
		} catch {
			/* The confetti canvas may already be gone. */
		}
		shooter = null;
		if (musicFrame) cancelAnimationFrame(musicFrame);
		musicFrame = 0;
		if (music) {
			music.pause();
			music.removeAttribute('src');
			music.load();
			music = null;
		}
		clearWebGL();

		window.removeEventListener('keydown', onKeyDown);
		window.removeEventListener('wheel', preventGesture);
		window.removeEventListener('touchmove', preventGesture);
		overlay.removeEventListener('click', requestClose);

		document.documentElement.classList.remove('s2-scroll-lock');
		if (Math.abs(window.scrollY - scrollY) > 1) window.scrollTo(0, scrollY);

		for (const node of inertNodes) node.removeAttribute('inert');
		inertNodes.length = 0;

		if (document.activeElement instanceof HTMLElement && overlay.contains(document.activeElement)) {
			document.activeElement.blur();
		}

		webglCanvas.hidden = false;
		webglCanvas.style.opacity = '';
		fallback.hidden = true;
		coin.classList.remove('is-idle');
		coin.removeAttribute('style');
		caption.removeAttribute('style');
		overlay.classList.remove('is-open', 'is-leaving', 'is-quick');
		overlay.hidden = true;
	}

	return {
		get dismissed() {
			return dismissed;
		},
		open,
		startMusic,
		playWebGL,
		playCss,
		clearWebGL,
		waitForClose,
		fadeOut,
		destroy,
	};
}

function THREE_NS_DEG(degrees: number) {
	return (degrees * Math.PI) / 180;
}
