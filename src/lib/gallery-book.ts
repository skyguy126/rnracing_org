import gsap from 'gsap';
import { PageFlip } from 'page-flip/dist/js/page-flip.module.js';
import { GALLERY_PHOTO_COUNT, galleryImages } from '../data/gallery';
import {
	createGalleryLayout,
	createImageMeta,
	findPageForPhoto,
	photoRangeLabel,
	type GalleryImageMeta,
	type GalleryPageLayout,
	type GalleryLayoutOptions,
} from './gallery-layout';

const FLIP_MS = 780;
const PRELOAD_PAGE_RADIUS = 2;
const NARROW_BREAKPOINT = 720;

type BookMode = 'single' | 'spread';

type GalleryElements = {
	root: HTMLElement;
	stage: HTMLElement;
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
	nextBtn: HTMLButtonElement;
	counter: HTMLElement;
	photoRange: HTMLElement;
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

function prefersReducedMotion() {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function pad(n: number) {
	return String(n).padStart(2, '0');
}

function preloadImage(src: string) {
	return new Promise<void>((resolve) => {
		const img = new Image();
		img.decoding = 'async';
		img.onload = () => {
			const decoded = img.decode?.() ?? Promise.resolve();
			decoded.then(() => resolve(), () => resolve());
		};
		img.onerror = () => resolve();
		img.src = src;
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

function measureBook(stage: HTMLElement) {
	const rect = stage.getBoundingClientRect();
	const controlsReserve = 96;
	const availableW = Math.max(280, rect.width - 32);
	const availableH = Math.max(300, rect.height - controlsReserve);
	const pageAspect = 1600 / 1100;
	const isNarrow = availableW < NARROW_BREAKPOINT || window.matchMedia(`(max-width: ${NARROW_BREAKPOINT - 1}px)`).matches;
	const mode: BookMode = isNarrow ? 'single' : 'spread';

	let pageWidth: number;
	let pageHeight: number;

	if (mode === 'single') {
		pageWidth = Math.min(availableW * 0.94, 440);
		pageHeight = pageWidth / pageAspect;
		if (pageHeight > availableH * 0.8) {
			pageHeight = availableH * 0.8;
			pageWidth = pageHeight * pageAspect;
		}
	} else {
		pageWidth = Math.min(availableW * 0.46, 540);
		pageHeight = pageWidth / pageAspect;
		if (pageHeight > availableH * 0.84) {
			pageHeight = availableH * 0.84;
			pageWidth = pageHeight * pageAspect;
		}
	}

	return {
		width: Math.round(pageWidth),
		height: Math.round(pageHeight),
		mode,
	};
}

function layoutOptions(size: { width: number; height: number; mode: BookMode }): GalleryLayoutOptions {
	return {
		pageWidth: size.width,
		pageHeight: size.height,
		mode: size.mode,
	};
}

function hydrateImage(img: HTMLImageElement) {
	const src = img.dataset.gallerySrc;
	if (!src || img.getAttribute('src') === src) return;
	img.loading = 'eager';
	img.src = src;
}

function preloadPages(bookEl: HTMLElement, pages: GalleryPageLayout[], photoPageIndex: number | null) {
	const targets = new Set<number>();
	if (photoPageIndex == null) {
		for (let i = 0; i < Math.min(3, pages.length); i += 1) targets.add(i);
	} else {
		for (let i = photoPageIndex - PRELOAD_PAGE_RADIUS; i <= photoPageIndex + PRELOAD_PAGE_RADIUS; i += 1) {
			if (i >= 0 && i < pages.length) targets.add(i);
		}
	}

	for (const pageIdx of targets) {
		const page = pages[pageIdx];
		if (!page) continue;
		for (const photo of page.photos) {
			for (const img of bookEl.querySelectorAll<HTMLImageElement>('img[data-gallery-src]')) {
				if (img.dataset.gallerySrc === photo.src) hydrateImage(img);
			}
			void preloadImage(photo.src);
		}
	}
}

function createMotes(container: HTMLElement, count: number) {
	container.replaceChildren();
	for (let i = 0; i < count; i += 1) {
		const mote = document.createElement('span');
		mote.className = 'gallery-mote';
		mote.style.setProperty('--mx', `${8 + Math.random() * 84}%`);
		mote.style.setProperty('--ms', `${0.55 + Math.random() * 1.1}`);
		mote.style.setProperty('--md', `${1.6 + Math.random() * 1.8}s`);
		mote.style.setProperty('--mdelay', `${Math.random() * 0.9}s`);
		container.appendChild(mote);
	}
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
		button.setAttribute(
			'aria-label',
			`Open photo ${slot.photo.index + 1} of ${GALLERY_PHOTO_COUNT}`,
		);

		const img = document.createElement('img');
		img.dataset.gallerySrc = slot.photo.src;
		img.alt = `RN Racing gallery photo ${slot.photo.index + 1}`;
		img.decoding = 'async';
		img.draggable = false;
		img.style.objectFit = slot.objectFit;

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

function buildPageNodes(
	els: GalleryElements,
	layouts: GalleryPageLayout[],
): HTMLElement[] {
	const photoPages = layouts.map((layout, index) => renderPhotoPage(layout, index + 1));
	return [
		els.coverPage.cloneNode(true) as HTMLElement,
		...photoPages,
		els.endPage.cloneNode(true) as HTMLElement,
		els.rearPage.cloneNode(true) as HTMLElement,
	];
}

function photoPageIndexFromFlip(pageIndex: number, photoPageCount: number): number | null {
	if (pageIndex < 1 || pageIndex > photoPageCount) return null;
	return pageIndex - 1;
}

function firstPhotoOnFlipPage(runtime: BookRuntime, flipIndex: number): number | null {
	const photoPage = photoPageIndexFromFlip(flipIndex, runtime.photoPageCount);
	if (photoPage == null) {
		if (flipIndex <= 0) return runtime.pages[0]?.photos[0]?.index ?? 0;
		return runtime.pages[runtime.pages.length - 1]?.photos[0]?.index ?? 0;
	}
	return runtime.pages[photoPage]?.photos[0]?.index ?? null;
}

function updateCounter(els: GalleryElements, runtime: BookRuntime, flipIndex: number) {
	const photoPage = photoPageIndexFromFlip(flipIndex, runtime.photoPageCount);
	if (photoPage == null) {
		if (flipIndex <= 0) {
			els.counter.textContent = `— / ${pad(runtime.photoPageCount)}`;
			els.photoRange.textContent = 'Cover';
		} else {
			els.counter.textContent = `${pad(runtime.photoPageCount)} / ${pad(runtime.photoPageCount)}`;
			els.photoRange.textContent = flipIndex >= runtime.totalPageCount - 1 ? 'Rear cover' : 'End of album';
		}
		return;
	}

	const layout = runtime.pages[photoPage]!;
	els.counter.textContent = `${pad(photoPage + 1)} / ${pad(runtime.photoPageCount)}`;
	els.photoRange.textContent = photoRangeLabel(layout);
}

function updateControls(els: GalleryElements, runtime: BookRuntime, flipping: boolean) {
	const index = runtime.pageFlip.getCurrentPageIndex();
	const lastIndex = runtime.totalPageCount - 1;
	els.prevBtn.disabled = flipping || index <= 0;
	els.nextBtn.disabled = flipping || index >= lastIndex;
	els.prevBtn.setAttribute('aria-disabled', String(els.prevBtn.disabled));
	els.nextBtn.setAttribute('aria-disabled', String(els.nextBtn.disabled));
	updateCounter(els, runtime, index);
	preloadPages(els.book, runtime.pages, photoPageIndexFromFlip(index, runtime.photoPageCount));
}

async function playIntroReveal(els: GalleryElements): Promise<void> {
	const reduced = prefersReducedMotion();
	els.root.dataset.intro = 'playing';
	els.controls.style.opacity = '0';
	els.controls.style.pointerEvents = 'none';

	if (reduced) {
		gsap.set(els.stage, { opacity: 1 });
		gsap.set(els.halo, { opacity: 0.32, scale: 1 });
		gsap.set(els.rig, { opacity: 1, y: 0, rotateX: 0, rotateY: 0, scale: 1 });
		return;
	}

	createMotes(els.motes, 14);
	gsap.set(els.stage, { opacity: 0 });
	gsap.set(els.halo, { opacity: 0, scale: 0.55 });
	gsap.set(els.rig, {
		opacity: 1,
		y: '58vh',
		rotateX: 64,
		rotateY: -8,
		scale: 0.92,
		transformPerspective: 1600,
		transformOrigin: '50% 80%',
	});
	if (els.shimmer) {
		gsap.set(els.shimmer, { opacity: 0, xPercent: -120, yPercent: 30 });
	}

	const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

	tl.to(els.stage, { opacity: 1, duration: 0.4 }, 0);
	tl.to(els.halo, { opacity: 0.88, scale: 1.08, duration: 0.65 }, 0.08);
	tl.to(
		els.rig,
		{
			y: -18,
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
		tl.to(
			els.shimmer,
			{
				xPercent: 130,
				yPercent: -40,
				duration: 0.65,
				ease: 'power2.inOut',
			},
			0.95,
		);
		tl.to(els.shimmer, { opacity: 0, duration: 0.2 }, 1.45);
	}

	tl.to(els.halo, { opacity: 0.4, scale: 1, duration: 0.45 }, 1.25);
	tl.to(
		els.motes,
		{
			opacity: 1,
			duration: 0.18,
			onStart: () => {
				els.motes.dataset.active = 'true';
			},
		},
		0.8,
	);
	tl.to(els.motes, { opacity: 0, duration: 0.4, delay: 0.75 }, 1.4);

	await Promise.race([
		tl.then(() => undefined),
		new Promise<void>((resolve) => {
			window.setTimeout(resolve, 3200);
		}),
	]);

	gsap.set(els.stage, { opacity: 1 });
	gsap.set(els.rig, { y: 0, rotateX: 0, rotateY: 0, scale: 1 });
	els.motes.dataset.active = 'false';
	els.motes.replaceChildren();
	if (els.shimmer) els.shimmer.style.opacity = '0';
}

async function finishIntro(els: GalleryElements, openCover: () => void) {
	await new Promise<void>((r) => window.setTimeout(r, prefersReducedMotion() ? 40 : 90));
	openCover();

	await new Promise<void>((resolve) => {
		gsap.to(els.controls, {
			opacity: 1,
			duration: prefersReducedMotion() ? 0.2 : 0.38,
			ease: 'power2.out',
			onComplete: () => resolve(),
		});
	});

	els.controls.style.pointerEvents = '';
	els.root.dataset.intro = 'done';
	els.root.dataset.ready = 'true';

	if (!prefersReducedMotion()) {
		gsap.to(els.rig, {
			y: -3,
			duration: 2.8,
			ease: 'sine.inOut',
			yoyo: true,
			repeat: -1,
		});
	}
}

function sizePreview(els: GalleryElements, width: number, height: number) {
	if (!els.preview) return;
	els.preview.style.width = `${width}px`;
	els.preview.style.height = `${height}px`;
	els.preview.hidden = false;
}

function hidePreview(els: GalleryElements) {
	if (!els.preview) return;
	els.preview.hidden = true;
}

function queryElements(root: HTMLElement): GalleryElements | null {
	const stage = root.querySelector<HTMLElement>('[data-gallery-stage]');
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
	const nextBtn = root.querySelector<HTMLButtonElement>('[data-gallery-next]');
	const counter = root.querySelector<HTMLElement>('[data-gallery-counter]');
	const photoRange = root.querySelector<HTMLElement>('[data-gallery-photo-range]');
	const motes = root.querySelector<HTMLElement>('[data-gallery-motes]');
	const shimmer = root.querySelector<HTMLElement>('[data-gallery-shimmer]')
		?? root.querySelector<HTMLElement>('[data-gallery-preview-shimmer]');

	if (
		!stage ||
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
		!nextBtn ||
		!counter ||
		!photoRange ||
		!motes
	) {
		return null;
	}

	return {
		root,
		stage,
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
		nextBtn,
		counter,
		photoRange,
		motes,
		shimmer,
	};
}

function createPageFlip(book: HTMLElement, width: number, height: number) {
	return new PageFlip(book, {
		width,
		height,
		size: 'stretch',
		minWidth: Math.max(160, Math.round(width * 0.5)),
		maxWidth: Math.max(width, 580),
		minHeight: Math.max(140, Math.round(height * 0.5)),
		maxHeight: Math.max(height, 460),
		drawShadow: true,
		flippingTime: prefersReducedMotion() ? 160 : FLIP_MS,
		usePortrait: true,
		startZIndex: 2,
		autoSize: true,
		maxShadowOpacity: 0.55,
		showCover: true,
		mobileScrollSupport: true,
		clickEventForward: true,
		useMouseEvents: false,
		showPageCorners: false,
		disableFlipByClick: true,
		startPage: 0,
	});
}

export function initGalleryBook(root: HTMLElement) {
	const els = queryElements(root);
	if (!els) return () => {};

	let destroyed = false;
	let flipping = false;
	let metas: GalleryImageMeta[] | null = null;
	let runtime: BookRuntime | null = null;

	const bindPageFlip = (pageFlip: PageFlip, getRuntime: () => BookRuntime | null) => {
		pageFlip.on('flip', () => {
			flipping = false;
			const current = getRuntime();
			if (current) updateControls(els, current, false);
		});
		pageFlip.on('changeState', (event) => {
			flipping = event.data === 'flipping';
			const current = getRuntime();
			if (current) updateControls(els, current, flipping);
		});
		pageFlip.on('changeOrientation', () => {
			const current = getRuntime();
			if (current) updateControls(els, current, flipping);
		});
	};

	const mountBook = (preservePhotoIndex: number | null) =>
		new Promise<BookRuntime>((resolve, reject) => {
			try {
				const size = measureBook(els.stage);
				if (!metas) {
					reject(new Error('Gallery metadata is not ready'));
					return;
				}

				const pages = createGalleryLayout(metas, layoutOptions(size));
				const nodes = buildPageNodes(els, pages);

				if (runtime) {
					try {
						runtime.pageFlip.destroy();
					} catch {
						/* already gone */
					}
					runtime = null;
				}

				els.book.replaceChildren();
				hidePreview(els);

				const pageFlip = createPageFlip(els.book, size.width, size.height);
				const nextRuntime: BookRuntime = {
					pageFlip,
					pages,
					mode: size.mode,
					width: size.width,
					height: size.height,
					photoPageCount: pages.length,
					totalPageCount: nodes.length,
				};
				runtime = nextRuntime;
				bindPageFlip(pageFlip, () => runtime);

				let settled = false;
				const settle = () => {
					if (settled || !runtime) return;
					settled = true;
					updateControls(els, runtime, false);

					if (preservePhotoIndex != null) {
						const photoPage = findPageForPhoto(pages, preservePhotoIndex);
						const flipIndex = Math.min(photoPage + 1, runtime.totalPageCount - 1);
						pageFlip.turnToPage(flipIndex);
						updateControls(els, runtime, false);
					}

					resolve(runtime);
				};

				pageFlip.on('init', settle);
				pageFlip.loadFromHTML(nodes);
				preloadPages(
					els.book,
					pages,
					preservePhotoIndex == null ? 0 : findPageForPhoto(pages, preservePhotoIndex),
				);

				window.setTimeout(() => {
					if (!settled) settle();
				}, 500);
			} catch (error) {
				reject(error);
			}
		});

	const boot = async () => {
		els.root.dataset.boot = 'true';
		const size = measureBook(els.stage);
		sizePreview(els, size.width, size.height);
		els.controls.style.opacity = '0';
		els.controls.style.pointerEvents = 'none';
		metas = loadAllGalleryMetas();

		try {
			await playIntroReveal(els);
		} catch {
			gsap.set(els.stage, { opacity: 1 });
			gsap.set(els.rig, { y: 0, rotateX: 0, rotateY: 0, scale: 1 });
		}
		if (destroyed) return;

		try {
			const mounted = await mountBook(null);
			if (destroyed) return;
			await finishIntro(els, () => {
				if (destroyed || !runtime) return;
				if (prefersReducedMotion()) mounted.pageFlip.turnToNextPage();
				else mounted.pageFlip.flipNext('top');
			});
		} catch (error) {
			console.error('Gallery book failed to mount', error);
			gsap.set(els.stage, { opacity: 1 });
			els.controls.style.opacity = '1';
			els.controls.style.pointerEvents = '';
			els.root.dataset.intro = 'done';
			els.root.dataset.ready = 'true';
		}
	};

	void boot();

	const goPrev = () => {
		if (destroyed || flipping || !runtime || els.prevBtn.disabled) return;
		if (prefersReducedMotion()) runtime.pageFlip.turnToPrevPage();
		else runtime.pageFlip.flipPrev('top');
	};

	const goNext = () => {
		if (destroyed || flipping || !runtime || els.nextBtn.disabled) return;
		if (prefersReducedMotion()) runtime.pageFlip.turnToNextPage();
		else runtime.pageFlip.flipNext('top');
	};

	els.prevBtn.addEventListener('click', goPrev);
	els.nextBtn.addEventListener('click', goNext);

	const onKeyDown = (event: KeyboardEvent) => {
		if (document.body.classList.contains('modal-open')) return;
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			goPrev();
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			goNext();
		}
	};
	document.addEventListener('keydown', onKeyDown);

	let resizeTimer = 0;
	const onResize = () => {
		window.clearTimeout(resizeTimer);
		resizeTimer = window.setTimeout(() => {
			if (destroyed || !runtime || !metas) return;
			const size = measureBook(els.stage);
			const modeChanged = size.mode !== runtime.mode;
			const sizeChanged =
				Math.abs(size.width - runtime.width) > 48 || Math.abs(size.height - runtime.height) > 48;
			if (!modeChanged && !sizeChanged) {
				runtime.pageFlip.update();
				updateControls(els, runtime, flipping);
				return;
			}
			const photoIndex = firstPhotoOnFlipPage(runtime, runtime.pageFlip.getCurrentPageIndex());
			void mountBook(photoIndex);
		}, 140);
	};
	window.addEventListener('resize', onResize);
	window.addEventListener('orientationchange', onResize);

	return () => {
		destroyed = true;
		window.clearTimeout(resizeTimer);
		document.removeEventListener('keydown', onKeyDown);
		window.removeEventListener('resize', onResize);
		window.removeEventListener('orientationchange', onResize);
		gsap.killTweensOf([els.stage, els.halo, els.rig, els.controls, els.motes, els.shimmer].filter(Boolean));
		try {
			runtime?.pageFlip.destroy();
		} catch {
			/* already torn down */
		}
	};
}

export type GalleryLightboxApi = {
	open: (index: number, trigger?: HTMLElement | null) => void;
	close: () => void;
	isOpen: () => boolean;
};

export function initGalleryLightbox(root: HTMLElement): GalleryLightboxApi {
	const modal = root;
	const panel = root.querySelector<HTMLElement>('[data-lightbox-panel]');
	const image = root.querySelector<HTMLImageElement>('[data-lightbox-image]');
	const caption = root.querySelector<HTMLElement>('[data-lightbox-caption]');
	const closeTargets = root.querySelectorAll('[data-lightbox-close]');

	let lastFocused: HTMLElement | null = null;
	let openRequest = 0;
	let open = false;

	const clearImage = () => {
		if (!image) return;
		image.removeAttribute('src');
		image.alt = '';
		image.hidden = true;
	};

	const close = () => {
		openRequest += 1;
		open = false;
		modal.hidden = true;
		clearImage();
		document.body.classList.remove('modal-open');
		lastFocused?.focus();
	};

	const openAt = async (index: number, trigger?: HTMLElement | null) => {
		const entry = galleryImages[index];
		if (!entry || !panel || !image || !caption) return;
		const src = entry.src;

		const requestId = ++openRequest;
		lastFocused = trigger ?? (document.activeElement as HTMLElement | null);
		caption.textContent = `Photo ${index + 1} of ${GALLERY_PHOTO_COUNT}`;
		clearImage();

		try {
			await preloadImage(src);
		} catch {
			/* still open */
		}
		if (requestId !== openRequest) return;

		image.src = src;
		image.alt = `RN Racing gallery photo ${index + 1}`;
		image.hidden = false;
		modal.hidden = false;
		document.body.classList.add('modal-open');
		open = true;
		panel.focus();
	};

	closeTargets.forEach((target) => {
		target.addEventListener('click', close);
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && open) {
			event.preventDefault();
			close();
		}
	});

	return {
		open: openAt,
		close,
		isOpen: () => open,
	};
}

export function bindGalleryPhotoTriggers(scope: ParentNode, lightbox: GalleryLightboxApi) {
	scope.addEventListener('click', (event) => {
		const target = event.target as HTMLElement | null;
		const trigger = target?.closest<HTMLButtonElement>('.gallery-photo-trigger');
		if (!trigger) return;
		event.preventDefault();
		event.stopPropagation();
		const index = Number(trigger.dataset.photoIndex);
		if (!Number.isFinite(index)) return;
		void lightbox.open(index, trigger);
	});
}
