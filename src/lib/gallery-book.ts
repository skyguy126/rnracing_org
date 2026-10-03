import gsap from 'gsap';
import { PageFlip } from 'page-flip/dist/js/page-flip.module.js';
import { galleryImages } from '../data/gallery';
import {
	PAGE_ASPECT,
	createGalleryLayout,
	createImageMeta,
	findPageForPhoto,
	pageGeometry,
	type GalleryImageMeta,
	type GalleryPageLayout,
	type GalleryLayoutOptions,
	type PageGeometry,
} from './gallery-layout';

const FLIP_MS = 780;
const CAMERA_IN_MS = 0.55;
const CAMERA_OUT_MS = 0.42;
const MAX_CAMERA_SCALE = 4.75;

type BookMode = 'single' | 'spread';

type GalleryViewState =
	| { mode: 'book' }
	| { mode: 'photo-focus'; photoIndex: number; trigger: HTMLElement }
	| { mode: 'lightbox'; photoIndex: number };

type RestoreTarget = { type: 'cover' } | { type: 'end' } | { type: 'photo'; photoIndex: number };

type GalleryElements = {
	root: HTMLElement;
	stage: HTMLElement;
	camera: HTMLElement;
	halo: HTMLElement;
	rig: HTMLElement;
	shell: HTMLElement;
	book: HTMLElement;
	preview: HTMLElement | null;
	pageSource: HTMLElement;
	coverPage: HTMLElement;
	endPage: HTMLElement;
	rearPage: HTMLElement;
	controls: HTMLElement;
	prevBtn: HTMLButtonElement;
	homeBtn: HTMLButtonElement;
	nextBtn: HTMLButtonElement;
	counter: HTMLElement;
	motes: HTMLElement;
	shimmer: HTMLElement | null;
};

type BookRuntime = {
	pageFlip: PageFlip;
	pages: GalleryPageLayout[];
	mode: BookMode;
	width: number;
	height: number;
	photoPageCount: number;
	totalPageCount: number;
};

type MeasuredBook = {
	width: number;
	height: number;
	mode: BookMode;
};

function prefersReducedMotion() {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function pad(n: number) {
	return String(n).padStart(2, '0');
}

function nextFrame() {
	return new Promise<void>((resolve) => {
		requestAnimationFrame(() => resolve());
	});
}

function isIOSDevice() {
	const ua = navigator.userAgent;
	if (/iPad|iPhone|iPod/i.test(ua)) return true;
	return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
let flipLoopSession = 0;
let flipLoopPaused = false;
let flipLoopStopWhenIdle = false;
let flipLoopCallback: FrameRequestCallback | null = null;
let flipLoopGuardInstalled = false;

function isPageFlipFrame(callback: FrameRequestCallback) {
	return Function.prototype.toString.call(callback).includes('this.render(');
}

function installFlipLoopGuard() {
	if (flipLoopGuardInstalled) return;
	flipLoopGuardInstalled = true;
	window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
		if (!isPageFlipFrame(callback)) return nativeRequestAnimationFrame(callback);
		const session = flipLoopSession;
		flipLoopCallback = callback;
		if (flipLoopPaused) return 0;
		return nativeRequestAnimationFrame((time) => {
			if (session !== flipLoopSession) return;
			callback(time);
		});
	}) as typeof window.requestAnimationFrame;
}

function armFlipLoop() {
	installFlipLoopGuard();
	flipLoopPaused = false;
}

function pauseFlipLoop() {
	if (flipLoopStopWhenIdle) flipLoopPaused = true;
}

function resumeFlipLoop() {
	const wasPaused = flipLoopPaused;
	flipLoopPaused = false;
	if (!wasPaused) return;
	const callback = flipLoopCallback;
	const session = flipLoopSession;
	if (!callback) return;
	nativeRequestAnimationFrame((time) => {
		if (session !== flipLoopSession) return;
		callback(time);
	});
}

function stopFlipLoop() {
	flipLoopSession += 1;
	flipLoopPaused = true;
	flipLoopCallback = null;
}

const mountedBooks = new Set<HTMLElement>();

type LivePhoto = {
	img: HTMLImageElement;
	ready: Promise<void>;
};

const livePhotos = new Map<string, LivePhoto>();
let albumPrefetchId = 0;

function retainImage(src: string) {
	const existing = livePhotos.get(src);
	if (existing) return existing.ready;

	const img = new Image();
	img.decoding = 'async';
	img.fetchPriority = 'high';
	let markReady = () => {};
	const ready = new Promise<void>((resolve) => {
		markReady = resolve;
	}).then(async () => {
		try {
			await img.decode();
		} catch {
			/* the element can still paint from the network image */
		}
	});
	img.addEventListener('load', () => markReady(), { once: true });
	img.addEventListener('error', () => markReady(), { once: true });
	img.src = src;
	if (img.complete) markReady();
	livePhotos.set(src, { img, ready });
	return ready;
}

function releaseImage(src: string) {
	const live = livePhotos.get(src);
	if (!live) return;
	live.img.removeAttribute('src');
	livePhotos.delete(src);
}

function paintMountedBooks() {
	for (const book of mountedBooks) {
		if (!book.isConnected) {
			mountedBooks.delete(book);
			continue;
		}
		for (const node of book.querySelectorAll<HTMLImageElement>('img[data-gallery-src]')) {
			const src = node.dataset.gallerySrc;
			if (!src) continue;
			if (livePhotos.has(src)) {
				if (node.getAttribute('src') !== src) {
					node.decoding = 'async';
					node.src = src;
				}
			} else if (node.hasAttribute('src')) {
				node.removeAttribute('src');
			}
		}
	}
}

function whenCached(src: string) {
	return retainImage(src);
}

function prefetchAlbum() {
	const schedule = window.requestIdleCallback ?? ((callback: IdleRequestCallback) => window.setTimeout(() => callback({ didTimeout: true, timeRemaining: () => 0 }), 400));
	const cancel = window.cancelIdleCallback ?? window.clearTimeout;
	if (albumPrefetchId) cancel(albumPrefetchId);
	albumPrefetchId = schedule(() => {
		albumPrefetchId = 0;
		const head = document.head;
		for (const entry of galleryImages) {
			if (head.querySelector(`link[rel="prefetch"][href="${CSS.escape(entry.src)}"]`)) continue;
			const link = document.createElement('link');
			link.rel = 'prefetch';
			link.as = 'image';
			link.href = entry.src;
			head.appendChild(link);
		}
	});
}

export function loadGalleryImageMeta(
	entry: { src: string; width: number; height: number },
	index: number,
): GalleryImageMeta {
	return createImageMeta(index, entry.src, entry.width, entry.height);
}

export function loadAllGalleryMetas(entries: readonly { src: string; width: number; height: number }[] = galleryImages) {
	return entries.map((entry, index) => loadGalleryImageMeta(entry, index));
}

function fitPage(maxWidth: number, maxHeight: number) {
	let width = maxWidth;
	let height = width / PAGE_ASPECT;
	if (height > maxHeight) {
		height = maxHeight;
		width = height * PAGE_ASPECT;
	}
	return { width, height };
}

function measureBook(camera: HTMLElement): MeasuredBook {
	const availableW = Math.max(160, camera.clientWidth);
	const availableH = Math.max(200, camera.clientHeight);

	const spread = fitPage((availableW * 0.94) / 2, availableH * 0.9);
	const spreadUseful =
		spread.width >= 280 &&
		spread.height >= 400 &&
		spread.width * 2 <= availableW + 1 &&
		spread.height <= availableH + 1;

	if (spreadUseful) {
		return {
			mode: 'spread',
			width: Math.round(spread.width),
			height: Math.round(spread.height),
		};
	}

	const single = fitPage(availableW * 0.98, availableH * 0.96);
	return {
		mode: 'single',
		width: Math.max(140, Math.round(single.width)),
		height: Math.max(200, Math.round(single.height)),
	};
}

function layoutOptions(size: MeasuredBook): GalleryLayoutOptions {
	return {
		pageWidth: size.width,
		pageHeight: size.height,
		mode: size.mode,
	};
}

function applyGeometry(root: HTMLElement, geo: PageGeometry) {
	root.style.setProperty('--gallery-page-pad', `${geo.padding}px`);
	root.style.setProperty('--gallery-num-h', `${geo.pageNumberHeight}px`);
	root.style.setProperty('--gallery-num-gap', `${geo.pageNumberGap}px`);
	root.style.setProperty('--gallery-collage-gap', `${geo.collageGap}px`);
	root.style.setProperty('--gallery-photo-pad', `${geo.photoPad}px`);
}

function mountCachedImages(bookEl: HTMLElement) {
	mountedBooks.add(bookEl);
	paintMountedBooks();
}

function createMotes(container: HTMLElement, count: number) {
	container.replaceChildren();
	for (let i = 0; i < count; i += 1) {
		const mote = document.createElement('span');
		mote.className = 'gallery-mote';
		const duration = 6.5 + Math.random() * 8;
		mote.style.setProperty('--mx', `${Math.random() * 100}%`);
		mote.style.setProperty('--ms', `${0.85 + Math.random() * 2.4}`);
		mote.style.setProperty('--md', `${duration.toFixed(2)}s`);
		mote.style.setProperty('--mdelay', `${(-Math.random() * duration).toFixed(2)}s`);
		mote.style.setProperty('--drift', `${(-70 + Math.random() * 140).toFixed(1)}px`);
		mote.style.setProperty('--mo', `${(0.28 + Math.random() * 0.28).toFixed(2)}`);
		container.appendChild(mote);
	}
	container.dataset.live = 'true';
}

function renderPhotoPage(layout: GalleryPageLayout, pageNumber: number): HTMLElement {
	const page = document.createElement('div');
	page.className = 'gallery-page gallery-page--photo';
	page.dataset.template = layout.template;
	page.dataset.photoPage = String(pageNumber);

	const surface = document.createElement('div');
	surface.className = 'gallery-page__surface';

	const collage = document.createElement('div');
	collage.className = `gallery-collage gallery-collage--${layout.template}`;

	for (const slot of layout.slots) {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'gallery-photo-trigger';
		button.dataset.photoIndex = String(slot.photo.index);
		button.dataset.area = slot.area;
		button.style.gridArea = slot.area;
		button.setAttribute('aria-label', 'Inspect photograph');

		const img = document.createElement('img');
		img.dataset.gallerySrc = slot.photo.src;
		img.alt = 'RN Racing photograph';
		img.decoding = 'async';
		img.draggable = false;
		img.style.objectFit = 'cover';
		img.style.objectPosition = 'center';

		button.appendChild(img);
		collage.appendChild(button);
	}

	const number = document.createElement('span');
	number.className = 'gallery-page__number';
	number.setAttribute('aria-hidden', 'true');
	number.textContent = pad(pageNumber);

	surface.append(collage, number);

	const grain = document.createElement('div');
	grain.className = 'gallery-page__grain';
	grain.setAttribute('aria-hidden', 'true');

	page.append(surface, grain);
	return page;
}

function renderEndpaper(): HTMLElement {
	const page = document.createElement('div');
	page.className = 'gallery-page gallery-page--endpaper';
	const surface = document.createElement('div');
	surface.className = 'gallery-page__surface gallery-page__surface--endpaper';
	page.appendChild(surface);
	return page;
}

function needsRearBlank(photoPageCount: number) {
	return (photoPageCount + 2) % 2 === 0;
}

function buildPageNodes(els: GalleryElements, layouts: GalleryPageLayout[]): HTMLElement[] {
	const photoPages = layouts.map((layout, index) => renderPhotoPage(layout, index + 1));
	const tail: HTMLElement[] = [els.endPage.cloneNode(true) as HTMLElement];
	if (needsRearBlank(layouts.length)) tail.push(renderEndpaper());
	tail.push(els.rearPage.cloneNode(true) as HTMLElement);
	return [els.coverPage.cloneNode(true) as HTMLElement, ...photoPages, ...tail];
}

function photoPageIndexFromFlip(pageIndex: number, photoPageCount: number): number | null {
	if (pageIndex < 1 || pageIndex > photoPageCount) return null;
	return pageIndex - 1;
}

function landscapeSpreadStarts(total: number): number[] {
	if (total <= 0) return [];
	const starts = [0];
	let index = 1;
	while (index < total) {
		starts.push(index);
		if (total - index <= 2) break;
		index += 2;
	}
	return starts;
}

function stepIndex(current: number, total: number, mode: BookMode, direction: 1 | -1) {
	if (total <= 0) return 0;
	if (mode === 'single') return Math.max(0, Math.min(total - 1, current + direction));

	const starts = landscapeSpreadStarts(total);
	let position = starts.findIndex((start, index) => {
		const next = starts[index + 1] ?? total;
		return current >= start && current < next;
	});
	if (position < 0) position = 0;
	const nextPosition = Math.max(0, Math.min(starts.length - 1, position + direction));
	return starts[nextPosition] ?? current;
}

function spreadFlipIndexes(runtime: BookRuntime, index: number) {
	if (runtime.mode !== 'spread') return [index];
	const starts = landscapeSpreadStarts(runtime.totalPageCount);
	for (let i = 0; i < starts.length; i += 1) {
		const start = starts[i]!;
		const end = starts[i + 1] ?? runtime.totalPageCount;
		if (index >= start && index < end) {
			const indexes: number[] = [];
			for (let page = start; page < end; page += 1) indexes.push(page);
			return indexes;
		}
	}
	return [index];
}

function spreadSrcs(runtime: BookRuntime, index: number) {
	const srcs: string[] = [];
	for (const flipIndex of spreadFlipIndexes(runtime, index)) {
		const photoPage = photoPageIndexFromFlip(flipIndex, runtime.photoPageCount);
		if (photoPage == null) continue;
		for (const photo of runtime.pages[photoPage]?.photos ?? []) srcs.push(photo.src);
	}
	return srcs;
}

function warmIndexes(runtime: BookRuntime, indexes: number[]) {
	const needed = new Set<string>();
	for (const index of indexes) {
		for (const src of spreadSrcs(runtime, index)) needed.add(src);
	}
	const pending = [...needed].map((src) => retainImage(src));
	for (const src of [...livePhotos.keys()]) {
		if (!needed.has(src)) releaseImage(src);
	}
	paintMountedBooks();
	return Promise.all(pending).then(() => undefined);
}

function warmSpreads(runtime: BookRuntime, index: number, direction: 1 | -1) {
	return warmIndexes(runtime, [
		index,
		stepIndex(index, runtime.totalPageCount, runtime.mode, direction),
	]);
}

function coverPose(runtime: BookRuntime, index: number) {
	const bleed = 72;
	const open = {
		x: 0,
		clip: `inset(-${bleed}px -${bleed}px -${bleed}px -${bleed}px)`,
		side: 'spread' as const,
	};
	if (runtime.mode !== 'spread') {
		return { x: 0, clip: 'none', side: 'spread' as const };
	}
	const page = runtime.width;
	if (index <= 0) {
		return {
			x: -page / 2,
			clip: `inset(-${bleed}px -${bleed}px -${bleed}px ${page}px)`,
			side: 'front' as const,
		};
	}
	if (index >= runtime.totalPageCount - 1) {
		return {
			x: page / 2,
			clip: `inset(-${bleed}px ${page}px -${bleed}px -${bleed}px)`,
			side: 'back' as const,
		};
	}
	return open;
}

function updateCounter(els: GalleryElements, runtime: BookRuntime, flipIndex: number) {
	const photoPage = photoPageIndexFromFlip(flipIndex, runtime.photoPageCount);
	if (photoPage == null) {
		els.counter.textContent = flipIndex <= 0
			? `— / ${pad(runtime.photoPageCount)}`
			: `${pad(runtime.photoPageCount)} / ${pad(runtime.photoPageCount)}`;
		return;
	}

	els.counter.textContent = `${pad(photoPage + 1)} / ${pad(runtime.photoPageCount)}`;
}

function updateControls(els: GalleryElements, runtime: BookRuntime, flipping: boolean, locked: boolean) {
	const index = runtime.pageFlip.getCurrentPageIndex();
	const lastIndex = runtime.totalPageCount - 1;
	const atStart = index <= 0;
	const atEnd = index >= lastIndex;
	els.prevBtn.disabled = locked || flipping || atStart;
	els.homeBtn.disabled = locked || flipping || atStart;
	els.nextBtn.disabled = locked || flipping || atEnd;
	els.prevBtn.setAttribute('aria-disabled', String(els.prevBtn.disabled));
	els.homeBtn.setAttribute('aria-disabled', String(els.homeBtn.disabled));
	els.nextBtn.setAttribute('aria-disabled', String(els.nextBtn.disabled));
	updateCounter(els, runtime, index);
	const onHardCover = !flipping && (index <= 0 || index >= runtime.totalPageCount - 1);
	els.root.dataset.cover = onHardCover ? 'closed' : 'open';
}

function syncShell(els: GalleryElements, runtime: BookRuntime, index: number, animate: boolean) {
	const pose = coverPose(runtime, index);
	els.root.dataset.bookSide = pose.side;
	const vars = { x: pose.x, clipPath: pose.clip };
	const instant = !animate || prefersReducedMotion() || els.root.dataset.lite === 'true';
	if (instant) {
		gsap.set(els.shell, vars);
		return;
	}
	gsap.to(els.shell, {
		...vars,
		duration: FLIP_MS / 1000,
		ease: 'power2.inOut',
		overwrite: 'auto',
	});
}

async function playIntroReveal(els: GalleryElements, lite: boolean): Promise<void> {
	const reduced = prefersReducedMotion();
	els.root.dataset.intro = 'playing';
	els.shimmer = els.book.querySelector<HTMLElement>('[data-gallery-shimmer]');

	if (reduced) {
		gsap.set(els.stage, { opacity: 1 });
		gsap.set(els.halo, { opacity: 0.32, scale: 1 });
		gsap.set(els.rig, { opacity: 1, y: 0, rotateX: 0, rotateY: 0, scale: 1 });
		return;
	}

	if (lite) {
		gsap.set(els.stage, { opacity: 0 });
		gsap.set(els.halo, { opacity: 0, scale: 0.92 });
		gsap.set(els.rig, { opacity: 1, y: 28, scale: 0.98 });
		const liteTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
		liteTl.to(els.stage, { opacity: 1, duration: 0.35 }, 0);
		liteTl.to(els.halo, { opacity: 0.35, scale: 1, duration: 0.55 }, 0.05);
		liteTl.to(els.rig, { y: 0, scale: 1, duration: 0.7 }, 0.05);
		await liteTl.then(() => undefined);
		gsap.set(els.stage, { opacity: 1 });
		gsap.set(els.rig, { y: 0, scale: 1 });
		gsap.set(els.halo, { opacity: 0.35, scale: 1 });
		return;
	}

	createMotes(els.motes, 40);
	gsap.set(els.motes, { opacity: 0 });
	gsap.set(els.stage, { opacity: 0 });
	gsap.set(els.halo, { opacity: 0, scale: 0.55 });
	gsap.set(els.rig, {
		opacity: 1,
		y: '46vh',
		rotateX: 58,
		rotateY: -8,
		scale: 0.94,
		transformPerspective: 1800,
		transformOrigin: '50% 78%',
	});
	if (els.shimmer) gsap.set(els.shimmer, { opacity: 0, xPercent: -120, yPercent: 30 });

	const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
	tl.to(els.stage, { opacity: 1, duration: 0.4 }, 0);
	tl.to(els.halo, { opacity: 0.88, scale: 1.08, duration: 0.65 }, 0.08);
	tl.to(
		els.rig,
		{
			y: -16,
			rotateX: 8,
			rotateY: 4,
			scale: 1.02,
			duration: 1.0,
			ease: 'power4.out',
		},
		0.12,
	);
	tl.to(
		els.rig,
		{
			y: 0,
			rotateX: 0,
			rotateY: 0,
			scale: 1,
			duration: 0.5,
			ease: 'power2.inOut',
		},
		0.98,
	);

	if (els.shimmer) {
		tl.to(els.shimmer, { opacity: 0.85, duration: 0.1 }, 0.9);
		tl.to(els.shimmer, { xPercent: 130, yPercent: -40, duration: 0.65, ease: 'power2.inOut' }, 0.95);
		tl.to(els.shimmer, { opacity: 0, duration: 0.2 }, 1.45);
	}

	tl.to(els.halo, { opacity: 0.4, scale: 1, duration: 0.45 }, 1.25);
	tl.to(els.motes, { opacity: 1, duration: 0.9 }, 0.35);

	await Promise.race([
		tl.then(() => undefined),
		new Promise<void>((resolve) => {
			window.setTimeout(resolve, 3200);
		}),
	]);

	tl.kill();
	gsap.set(els.stage, { opacity: 1 });
	gsap.set(els.motes, { opacity: 1 });
	gsap.set(els.rig, { y: 0, rotateX: 0, rotateY: 0, scale: 1, transformPerspective: 1800 });
	if (els.shimmer) gsap.set(els.shimmer, { opacity: 0 });
}

function queryElements(root: HTMLElement): GalleryElements | null {
	const stage = root.querySelector<HTMLElement>('[data-gallery-stage]');
	const camera = root.querySelector<HTMLElement>('[data-gallery-camera]');
	const halo = root.querySelector<HTMLElement>('[data-gallery-halo]');
	const rig = root.querySelector<HTMLElement>('[data-gallery-rig]');
	const shell = root.querySelector<HTMLElement>('[data-gallery-shell]');
	const book = root.querySelector<HTMLElement>('[data-gallery-book]');
	const preview = root.querySelector<HTMLElement>('[data-gallery-preview]');
	const pageSource = root.querySelector<HTMLElement>('[data-gallery-page-source]');
	const coverPage = root.querySelector<HTMLElement>('[data-gallery-cover-page]');
	const endPage = root.querySelector<HTMLElement>('[data-gallery-end-page]');
	const rearPage = root.querySelector<HTMLElement>('[data-gallery-rear-page]');
	const controls = root.querySelector<HTMLElement>('[data-gallery-controls]');
	const prevBtn = root.querySelector<HTMLButtonElement>('[data-gallery-prev]');
	const homeBtn = root.querySelector<HTMLButtonElement>('[data-gallery-home]');
	const nextBtn = root.querySelector<HTMLButtonElement>('[data-gallery-next]');
	const counter = root.querySelector<HTMLElement>('[data-gallery-counter]');
	const motes = root.querySelector<HTMLElement>('[data-gallery-motes]');

	if (
		!stage ||
		!camera ||
		!halo ||
		!rig ||
		!shell ||
		!book ||
		!pageSource ||
		!coverPage ||
		!endPage ||
		!rearPage ||
		!controls ||
		!prevBtn ||
		!homeBtn ||
		!nextBtn ||
		!counter ||
		!motes
	) {
		return null;
	}

	return {
		root,
		stage,
		camera,
		halo,
		rig,
		shell,
		book,
		preview,
		pageSource,
		coverPage,
		endPage,
		rearPage,
		controls,
		prevBtn,
		homeBtn,
		nextBtn,
		counter,
		motes,
		shimmer: null,
	};
}

function destroyPageFlip(book: HTMLElement, pageFlip: PageFlip) {
	const parent = book.parentElement;
	const next = book.nextSibling;
	stopFlipLoop();
	try {
		pageFlip.destroy();
	} catch {
		/* already gone */
	}
	if (parent && !book.isConnected) parent.insertBefore(book, next);
}

function createPageFlip(book: HTMLElement, width: number, height: number, mode: BookMode, lite: boolean) {
	const bookWidth = mode === 'spread' ? width * 2 : width;
	book.style.width = `${bookWidth}px`;
	book.style.height = `${height}px`;
	book.style.maxWidth = 'none';

	return new PageFlip(book, {
		width,
		height,
		size: 'fixed',
		minWidth: width,
		maxWidth: width,
		minHeight: height,
		maxHeight: height,
		drawShadow: !lite,
		flippingTime: prefersReducedMotion() ? 160 : FLIP_MS,
		usePortrait: mode === 'single',
		startZIndex: 2,
		autoSize: false,
		maxShadowOpacity: 0.55,
		showCover: true,
		mobileScrollSupport: false,
		clickEventForward: true,
		useMouseEvents: false,
		showPageCorners: false,
		disableFlipByClick: true,
		startPage: 0,
	});
}

function loadPages(pageFlip: PageFlip, nodes: HTMLElement[]) {
	const original = window.addEventListener.bind(window);
	window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
		if (type === 'resize') return;
		original(type, listener, options);
	}) as typeof window.addEventListener;
	try {
		pageFlip.loadFromHTML(nodes);
	} finally {
		window.addEventListener = original as typeof window.addEventListener;
	}
}

function waitForInit(pageFlip: PageFlip) {
	return new Promise<void>((resolve) => {
		let settled = false;
		const finish = () => {
			if (settled) return;
			settled = true;
			resolve();
		};
		pageFlip.on('init', finish);
		window.setTimeout(finish, 700);
	});
}

async function waitForCameraBox(camera: HTMLElement) {
	for (let attempt = 0; attempt < 24; attempt += 1) {
		if (camera.clientWidth > 80 && camera.clientHeight > 80) return;
		await nextFrame();
	}
}

function readCameraTransform(camera: HTMLElement) {
	const scale = Number(gsap.getProperty(camera, 'scale'));
	const x = Number(gsap.getProperty(camera, 'x'));
	const y = Number(gsap.getProperty(camera, 'y'));
	return {
		scale: Number.isFinite(scale) && scale > 0 ? scale : 1,
		x: Number.isFinite(x) ? x : 0,
		y: Number.isFinite(y) ? y : 0,
	};
}

export type GalleryLightboxApi = {
	open: (index: number, trigger?: HTMLElement | null) => void;
	close: () => void;
	isOpen: () => boolean;
	setOnClose: (handler: (() => void) | null) => void;
};

export function initGalleryLightbox(root: HTMLElement): GalleryLightboxApi {
	const modal = root;
	const panel = root.querySelector<HTMLElement>('[data-lightbox-panel]');
	const image = root.querySelector<HTMLImageElement>('[data-lightbox-image]');

	let lastFocused: HTMLElement | null = null;
	let openRequest = 0;
	let open = false;
	let onClose: (() => void) | null = null;

	const clearImage = () => {
		if (!image) return;
		image.removeAttribute('src');
		image.alt = '';
		image.hidden = true;
	};

	const close = () => {
		const wasOpen = open;
		openRequest += 1;
		open = false;
		modal.hidden = true;
		clearImage();
		document.body.classList.remove('modal-open');
		if (wasOpen) {
			lastFocused?.focus();
			onClose?.();
		}
	};

	const openAt = async (index: number, trigger?: HTMLElement | null) => {
		const entry = galleryImages[index];
		if (!entry || !panel || !image) return;
		const src = entry.src;

		const requestId = ++openRequest;
		lastFocused = trigger ?? (document.activeElement as HTMLElement | null);
		clearImage();

		try {
			await whenCached(src);
		} catch {
			/* still open */
		}
		if (requestId !== openRequest) return;

		image.src = src;
		image.alt = '';
		image.hidden = false;
		modal.hidden = false;
		document.body.classList.add('modal-open');
		open = true;
		panel.focus();
	};

	modal.addEventListener('click', () => {
		if (open) close();
	});

	return {
		open: openAt,
		close,
		isOpen: () => open,
		setOnClose: (handler) => {
			onClose = handler;
		},
	};
}

export function initGalleryBook(root: HTMLElement, lightbox: GalleryLightboxApi) {
	const els = queryElements(root);
	if (!els) return () => {};

	let destroyed = false;
	let flipping = false;
	let rebuilding = false;
	let resizeQueued = false;
	let ready = false;
	let metas: GalleryImageMeta[] | null = null;
	let runtime: BookRuntime | null = null;
	let floatTween: gsap.core.Tween | null = null;
	let flipWatch = 0;
	let view: GalleryViewState = { mode: 'book' };
	let focusedTrigger: HTMLElement | null = null;
	let lastDirection: 1 | -1 = 1;
	const lite = isIOSDevice();
	flipLoopStopWhenIdle = lite;
	if (lite) els.root.dataset.lite = 'true';

	const navigationLocked = () => view.mode !== 'book' || els.root.dataset.view === 'returning';

	const clearFocused = () => {
		els.book.querySelectorAll('[data-gallery-focused]').forEach((node) => {
			node.removeAttribute('data-gallery-focused');
		});
	};

	const pauseFloat = (immediate = false) => {
		floatTween?.kill();
		floatTween = null;
		const vars = { x: 0, y: 0, rotateX: 0, rotateY: 0, overwrite: 'auto' as const };
		if (immediate || prefersReducedMotion()) gsap.set(els.rig, vars);
		else gsap.to(els.rig, { ...vars, duration: 0.35, ease: 'power2.out' });
	};

	const startFloat = () => {
		if (floatTween || prefersReducedMotion() || els.root.dataset.view !== 'book') return;
		if (lite) {
			floatTween = gsap.to(els.rig, {
				y: 8,
				duration: 4.8,
				ease: 'sine.inOut',
				yoyo: true,
				repeat: -1,
				overwrite: 'auto',
			});
			return;
		}
		floatTween = gsap.to(els.rig, {
			y: 12,
			x: 8,
			rotateX: 3.1,
			rotateY: -4.4,
			duration: 4.8,
			ease: 'sine.inOut',
			yoyo: true,
			repeat: -1,
			transformOrigin: '50% 52%',
			overwrite: 'auto',
		});
	};

	const resumeFloat = () => {
		if (destroyed || prefersReducedMotion() || els.root.dataset.view !== 'book') return;
		startFloat();
	};

	const syncHeaderHeight = () => {
		const header = document.querySelector('.site-header');
		if (!header) return;
		const height = Math.ceil(header.getBoundingClientRect().height);
		if (height > 0) els.root.style.setProperty('--gallery-header', `${height}px`);
	};

	const refreshControls = () => {
		if (!runtime) return;
		updateControls(els, runtime, flipping, navigationLocked() || rebuilding);
	};

	const settleFlip = () => {
		window.clearTimeout(flipWatch);
		flipping = false;
		pauseFlipLoop();
		delete els.root.dataset.motion;
		if (runtime) {
			syncShell(els, runtime, runtime.pageFlip.getCurrentPageIndex(), false);
			refreshControls();
			void warmSpreads(runtime, runtime.pageFlip.getCurrentPageIndex(), lastDirection);
		}
		if (!destroyed && ready && els.root.dataset.view === 'book') resumeFloat();
		if (resizeQueued && !destroyed) {
			resizeQueued = false;
			void rebuildFromResize();
		}
	};

	const bindPageFlip = (pageFlip: PageFlip) => {
		pageFlip.on('flip', () => {
			if (pageFlip !== runtime?.pageFlip) return;
			settleFlip();
		});
		pageFlip.on('changeState', (event) => {
			if (pageFlip !== runtime?.pageFlip) return;
			const turning = event.data === 'flipping' || event.data === 'user_fold' || event.data === 'fold_corner';
			if (turning) {
				flipping = true;
				refreshControls();
				return;
			}
			if (event.data === 'read') settleFlip();
		});
	};

	const mountBook = async (target: RestoreTarget | null, conceal: boolean) => {
		if (!metas) throw new Error('Gallery metadata is not ready');
		window.clearTimeout(flipWatch);
		flipping = false;
		syncHeaderHeight();
		await waitForCameraBox(els.camera);
		if (destroyed) return;

		const size = measureBook(els.camera);
		const geo = pageGeometry(size.width, size.height);
		applyGeometry(els.root, geo);
		const pages = createGalleryLayout(metas, layoutOptions(size));
		const nodes = buildPageNodes(els, pages);

		if (runtime) {
			destroyPageFlip(els.book, runtime.pageFlip);
			runtime = null;
		}

		if (conceal) els.shell.style.visibility = 'hidden';
		els.book.replaceChildren();
		if (els.preview) els.preview.hidden = true;

		const pageFlip = createPageFlip(els.book, size.width, size.height, size.mode, lite);
		const nextRuntime: BookRuntime = {
			pageFlip,
			pages,
			mode: size.mode,
			width: size.width,
			height: size.height,
			photoPageCount: pages.length,
			totalPageCount: nodes.length,
		};

		bindPageFlip(pageFlip);
		const readyForShow = waitForInit(pageFlip);
		armFlipLoop();
		loadPages(pageFlip, nodes);
		await readyForShow;
		if (destroyed) {
			stopFlipLoop();
			try {
				pageFlip.destroy();
			} catch {
				/* teardown */
			}
			return;
		}

		runtime = nextRuntime;
		if (target?.type === 'photo') {
			const photoPage = findPageForPhoto(pages, target.photoIndex);
			pageFlip.turnToPage(Math.min(photoPage + 1, nextRuntime.totalPageCount - 1));
		} else if (target?.type === 'end') {
			pageFlip.turnToPage(nextRuntime.totalPageCount - 1);
		} else {
			pageFlip.turnToPage(0);
		}

		syncShell(els, nextRuntime, pageFlip.getCurrentPageIndex(), false);
		mountCachedImages(els.book);
		els.shell.style.visibility = '';
		refreshControls();
		await nextFrame();
		if (!flipping) pauseFlipLoop();
	};

	const captureTarget = (): RestoreTarget => {
		if (view.mode !== 'book') return { type: 'photo', photoIndex: view.photoIndex };
		if (!runtime) return { type: 'cover' };
		const index = runtime.pageFlip.getCurrentPageIndex();
		const photoPage = photoPageIndexFromFlip(index, runtime.photoPageCount);
		if (photoPage != null) {
			return { type: 'photo', photoIndex: runtime.pages[photoPage]?.photos[0]?.index ?? 0 };
		}
		if (index <= 0) return { type: 'cover' };
		return { type: 'end' };
	};

	const findTrigger = (photoIndex: number) =>
		els.book.querySelector<HTMLElement>(`.gallery-photo-trigger[data-photo-index="${photoIndex}"]`);

	const focusPhoto = (trigger: HTMLElement) => {
		const photoIndex = Number(trigger.dataset.photoIndex);
		if (!Number.isFinite(photoIndex) || !runtime) return;
		pauseFloat();

		const current = readCameraTransform(els.camera);
		const photo = trigger.getBoundingClientRect();
		const cam = els.camera.getBoundingClientRect();
		const layoutLeft = cam.left - current.x;
		const layoutTop = cam.top - current.y;
		const photoCx = photo.left + photo.width / 2;
		const photoCy = photo.top + photo.height / 2;
		const localCx = (photoCx - cam.left) / current.scale;
		const localCy = (photoCy - cam.top) / current.scale;
		const layoutW = Math.max(1, photo.width / current.scale);
		const layoutH = Math.max(1, photo.height / current.scale);

		const vw = window.innerWidth;
		const dvh = window.visualViewport?.height ?? window.innerHeight;
		const preferred = runtime.mode === 'single'
			? { maxW: vw * 0.9, maxH: dvh * 0.72 }
			: { maxW: vw * 0.78, maxH: dvh * 0.78 };
		const maxW = Math.min(preferred.maxW, els.camera.clientWidth * 0.96);
		const maxH = Math.min(preferred.maxH, els.camera.clientHeight * 0.96);
		const scale = Math.min(MAX_CAMERA_SCALE, Math.max(0.35, Math.min(maxW / layoutW, maxH / layoutH)));

		const targetCx = layoutLeft + els.camera.clientWidth / 2;
		const targetCy = layoutTop + els.camera.clientHeight / 2;
		const x = targetCx - layoutLeft - localCx * scale;
		const y = targetCy - layoutTop - localCy * scale;

		clearFocused();
		trigger.setAttribute('data-gallery-focused', '');
		focusedTrigger = trigger;
		view = { mode: 'photo-focus', photoIndex, trigger };
		els.root.dataset.view = 'photo-focus';
		refreshControls();

		gsap.to(els.camera, {
			x,
			y,
			scale,
			transformOrigin: '0px 0px',
			duration: prefersReducedMotion() ? 0.01 : CAMERA_IN_MS,
			ease: 'power3.inOut',
			overwrite: 'auto',
		});
	};

	const exitFocus = () => {
		if (view.mode === 'book' || els.root.dataset.view === 'returning') return;
		if (lightbox.isOpen()) lightbox.close();
		clearFocused();
		focusedTrigger = null;
		els.root.dataset.view = 'returning';
		view = { mode: 'book' };
		refreshControls();

		gsap.to(els.camera, {
			x: 0,
			y: 0,
			scale: 1,
			transformOrigin: '0px 0px',
			duration: prefersReducedMotion() ? 0.01 : CAMERA_OUT_MS,
			ease: 'power3.inOut',
			overwrite: 'auto',
			onComplete: () => {
				if (destroyed) return;
				els.root.dataset.view = 'book';
				refreshControls();
				resumeFloat();
			},
		});
	};

	const openFocusedLightbox = () => {
		if (view.mode !== 'photo-focus') return;
		const photoIndex = view.photoIndex;
		view = { mode: 'lightbox', photoIndex };
		els.root.dataset.view = 'lightbox';
		void lightbox.open(photoIndex, focusedTrigger);
	};

	lightbox.setOnClose(() => {
		if (destroyed || view.mode !== 'lightbox') return;
		const trigger = focusedTrigger ?? findTrigger(view.photoIndex);
		if (!trigger) {
			exitFocus();
			return;
		}
		focusedTrigger = trigger;
		view = { mode: 'photo-focus', photoIndex: view.photoIndex, trigger };
		els.root.dataset.view = 'photo-focus';
		trigger.setAttribute('data-gallery-focused', '');
	});

	const startVisualFlip = (direction: 1 | -1 | 'home', dest: number) => {
		if (destroyed || !runtime || !flipping) return;
		els.root.dataset.motion = 'flip';
		syncShell(els, runtime, dest, true);
		window.clearTimeout(flipWatch);
		flipWatch = window.setTimeout(settleFlip, FLIP_MS + 700);
		resumeFlipLoop();
		if (direction === 'home') {
			if (prefersReducedMotion() || lite) runtime.pageFlip.turnToPage(0);
			else runtime.pageFlip.flip(0, 'bottom');
			return;
		}
		if (prefersReducedMotion() || lite) {
			if (direction > 0) runtime.pageFlip.turnToNextPage();
			else runtime.pageFlip.turnToPrevPage();
		} else if (direction > 0) {
			runtime.pageFlip.flipNext('bottom');
		} else {
			runtime.pageFlip.flipPrev('bottom');
		}
	};

	const beginFlip = (direction: 1 | -1) => {
		if (destroyed || !ready || !runtime || flipping || rebuilding || navigationLocked()) return;
		const current = runtime.pageFlip.getCurrentPageIndex();
		const dest = stepIndex(current, runtime.totalPageCount, runtime.mode, direction);
		if (dest === current) return;
		lastDirection = direction;
		pauseFloat(true);
		flipping = true;
		refreshControls();
		const imagesReady = warmSpreads(runtime, current, direction);
		void Promise.race([
			imagesReady,
			new Promise<void>((resolve) => {
				window.setTimeout(resolve, 140);
			}),
		]).then(() => startVisualFlip(direction, dest));
	};

	const boot = async () => {
		els.root.dataset.boot = 'true';
		els.root.dataset.view = 'book';
		els.root.dataset.cover = 'closed';
		gsap.set(els.camera, { x: 0, y: 0, scale: 1, transformOrigin: '0px 0px' });
		gsap.set(els.stage, { opacity: 0 });
		metas = loadAllGalleryMetas();

		try {
			await mountBook(null, false);
			if (destroyed) return;
			await playIntroReveal(els, lite);
		} catch (error) {
			console.error('Gallery book failed to mount', error);
			gsap.set(els.stage, { opacity: 1 });
			gsap.set(els.rig, { y: 0, rotateX: 0, rotateY: 0, scale: 1 });
		}
		if (destroyed) return;

		ready = true;
		els.root.dataset.intro = 'done';
		els.root.dataset.ready = 'true';
		refreshControls();
		startFloat();
		prefetchAlbum();
		if (resizeQueued) {
			resizeQueued = false;
			void rebuildFromResize();
		}
	};

	void boot();

	const goHome = () => {
		if (destroyed || !ready || !runtime || flipping || rebuilding || navigationLocked()) return;
		if (runtime.pageFlip.getCurrentPageIndex() <= 0) return;
		const current = runtime.pageFlip.getCurrentPageIndex();
		lastDirection = 1;
		pauseFloat(true);
		flipping = true;
		refreshControls();
		const imagesReady = warmIndexes(runtime, [current, 0, stepIndex(0, runtime.totalPageCount, runtime.mode, 1)]);
		void Promise.race([
			imagesReady,
			new Promise<void>((resolve) => {
				window.setTimeout(resolve, 140);
			}),
		]).then(() => startVisualFlip('home', 0));
	};

	els.prevBtn.addEventListener('pointerdown', () => {
		if (!runtime || flipping || !ready) return;
		void warmSpreads(runtime, runtime.pageFlip.getCurrentPageIndex(), -1);
	});
	els.nextBtn.addEventListener('pointerdown', () => {
		if (!runtime || flipping || !ready) return;
		void warmSpreads(runtime, runtime.pageFlip.getCurrentPageIndex(), 1);
	});
	els.prevBtn.addEventListener('click', () => beginFlip(-1));
	els.homeBtn.addEventListener('click', goHome);
	els.nextBtn.addEventListener('click', () => beginFlip(1));

	els.stage.addEventListener('click', (event) => {
		if (!ready || destroyed || lightbox.isOpen()) return;
		if (els.root.dataset.view === 'returning') return;
		const target = event.target as HTMLElement | null;
		const trigger = target?.closest<HTMLElement>('.gallery-photo-trigger');

		if (view.mode === 'book') {
			if (!trigger || flipping || rebuilding) return;
			event.preventDefault();
			focusPhoto(trigger);
			return;
		}

		if (view.mode === 'photo-focus') {
			event.preventDefault();
			if (trigger && Number(trigger.dataset.photoIndex) === view.photoIndex) {
				openFocusedLightbox();
				return;
			}
			if (trigger) {
				focusPhoto(trigger);
				return;
			}
			exitFocus();
		}
	});

	els.stage.addEventListener('dblclick', (event) => {
		event.preventDefault();
	});

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			if (lightbox.isOpen()) {
				event.preventDefault();
				lightbox.close();
				return;
			}
			if (view.mode === 'photo-focus') {
				event.preventDefault();
				exitFocus();
			}
			return;
		}

		if (!ready || navigationLocked() || lightbox.isOpen() || flipping) return;
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			beginFlip(-1);
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			beginFlip(1);
		}
	};
	document.addEventListener('keydown', onKeyDown);

	const rebuildFromResize = async () => {
		if (destroyed || !metas) return;
		if (!ready || !runtime || flipping || rebuilding) {
			resizeQueued = true;
			return;
		}
		rebuilding = true;
		refreshControls();
		try {
			syncHeaderHeight();
			await nextFrame();
			if (destroyed || !runtime) return;
			const size = measureBook(els.camera);
			const changed =
				size.mode !== runtime.mode ||
				Math.abs(size.width - runtime.width) > 12 ||
				Math.abs(size.height - runtime.height) > 12;
			if (!changed) return;

			const target = captureTarget();
			const returnToFocus = view.mode === 'photo-focus' || view.mode === 'lightbox';
			const lightboxOpen = lightbox.isOpen();
			const photoIndex = target.type === 'photo' ? target.photoIndex : null;
			gsap.killTweensOf(els.camera);
			gsap.set(els.camera, { x: 0, y: 0, scale: 1, transformOrigin: '0px 0px' });
			if (returnToFocus) {
				view = { mode: 'book' };
				els.root.dataset.view = 'book';
				clearFocused();
			}
			await mountBook(target, true);
			if (destroyed || !runtime) return;
			if (returnToFocus && photoIndex != null) {
				const trigger = findTrigger(photoIndex);
				if (trigger) {
					focusPhoto(trigger);
					if (lightboxOpen) {
						view = { mode: 'lightbox', photoIndex };
						els.root.dataset.view = 'lightbox';
					}
				}
			}
		} finally {
			rebuilding = false;
			refreshControls();
			if (resizeQueued && !destroyed) {
				resizeQueued = false;
				void rebuildFromResize();
			}
		}
	};

	let resizeTimer = 0;
	const onResize = () => {
		window.clearTimeout(resizeTimer);
		resizeTimer = window.setTimeout(() => {
			void rebuildFromResize();
		}, 160);
	};
	window.addEventListener('resize', onResize);
	window.addEventListener('orientationchange', onResize);

	return () => {
		destroyed = true;
		ready = false;
		stopFlipLoop();
		if (albumPrefetchId) {
			window.cancelIdleCallback?.(albumPrefetchId);
			window.clearTimeout(albumPrefetchId);
			albumPrefetchId = 0;
		}
		window.clearTimeout(resizeTimer);
		window.clearTimeout(flipWatch);
		document.removeEventListener('keydown', onKeyDown);
		window.removeEventListener('resize', onResize);
		window.removeEventListener('orientationchange', onResize);
		lightbox.setOnClose(null);
		floatTween?.kill();
		floatTween = null;
		gsap.killTweensOf([els.stage, els.camera, els.halo, els.rig, els.shell, els.motes, els.shimmer].filter(Boolean));
		if (runtime) destroyPageFlip(els.book, runtime.pageFlip);
	};
}
