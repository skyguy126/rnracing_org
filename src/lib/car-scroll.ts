const TOTAL_FRAMES = 169;

function frameSrc(index: number) {
	return `/frames/frame-${String(index + 1).padStart(3, '0')}.jpg`;
}

/** Assembled → exploded → hold → reassembled, across the scroll section. */
function progressToFrame(progress: number) {
	const last = TOTAL_FRAMES - 1;
	if (progress <= 0.08) return 0;
	if (progress <= 0.5) return Math.round(((progress - 0.08) / 0.42) * last);
	if (progress <= 0.62) return last;
	if (progress <= 0.94) return Math.round((1 - (progress - 0.62) / 0.32) * last);
	return 0;
}

function loadFrame(index: number) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.decoding = 'async';
		image.onload = () => resolve(image);
		image.onerror = reject;
		image.src = frameSrc(index);
	});
}

/** Average colour of one pixel row, so the letterbox on tall screens blends into the frame. */
function rowColor(context: CanvasRenderingContext2D, y: number, width: number) {
	const data = context.getImageData(0, y, width, 1).data;
	let r = 0;
	let g = 0;
	let b = 0;
	for (let i = 0; i < data.length; i += 4) {
		r += data[i];
		g += data[i + 1];
		b += data[i + 2];
	}
	const n = data.length / 4;
	return `rgb(${Math.round(r / n)} ${Math.round(g / n)} ${Math.round(b / n)})`;
}

function initFadeIns(root: HTMLElement) {
	const fadeIns = root.querySelectorAll<HTMLElement>('.home-scroll__fade-in');
	if (!fadeIns.length) return;

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
				}
			});
		},
		{ threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
	);

	fadeIns.forEach((element) => observer.observe(element));

	return () => observer.disconnect();
}

export function initCarScroll(root: HTMLElement) {
	const canvas = root.querySelector<HTMLCanvasElement>('.car-scroll__canvas');
	const loader = root.querySelector<HTMLElement>('.home-scroll__loader');
	if (!canvas) return;

	const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
	if (!context) return;

	const letterboxed = window.matchMedia('(max-aspect-ratio: 1/1)');
	const frames: (HTMLImageElement | undefined)[] = new Array(TOTAL_FRAMES);
	let lastPainted = -1;
	let rafId = 0;
	let disposed = false;

	/** Paints the requested frame, or the closest one that has finished loading. */
	const paint = (target: number) => {
		let index = -1;
		for (let offset = 0; offset < TOTAL_FRAMES; offset++) {
			if (frames[target - offset]) {
				index = target - offset;
				break;
			}
			if (frames[target + offset]) {
				index = target + offset;
				break;
			}
		}
		if (index === -1 || index === lastPainted) return;
		lastPainted = index;
		context.drawImage(frames[index]!, 0, 0);
		if (letterboxed.matches) {
			root.style.setProperty('--car-edge-top', rowColor(context, 2, canvas.width));
			root.style.setProperty('--car-edge-bottom', rowColor(context, canvas.height - 3, canvas.width));
		}
	};

	const sectionProgress = () => {
		const rect = root.getBoundingClientRect();
		const distance = rect.height - window.innerHeight;
		if (distance <= 0) return 0;
		return Math.min(Math.max(-rect.top / distance, 0), 1);
	};

	const update = () => paint(progressToFrame(sectionProgress()));

	const onScroll = () => {
		cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(update);
	};

	const disconnectFadeIns = initFadeIns(root);

	/** Loads the rest with a few requests in flight, repainting as nearer frames arrive. */
	const loadRemaining = () => {
		let next = 1;
		const worker = async () => {
			while (!disposed && next < TOTAL_FRAMES) {
				const index = next++;
				try {
					frames[index] = await loadFrame(index);
					update();
				} catch {
					/* a missing frame falls back to its nearest neighbour */
				}
			}
		};
		for (let i = 0; i < 6; i++) void worker();
	};

	loadFrame(0)
		.then((first) => {
			if (disposed) return;
			frames[0] = first;
			canvas.width = first.naturalWidth;
			canvas.height = first.naturalHeight;
			loader?.remove();
			update();
			window.addEventListener('scroll', onScroll, { passive: true });
			window.addEventListener('resize', onScroll, { passive: true });
			loadRemaining();
		})
		.catch(() => {
			if (loader) loader.textContent = 'Unable to load the car';
		});

	return () => {
		disposed = true;
		cancelAnimationFrame(rafId);
		window.removeEventListener('scroll', onScroll);
		window.removeEventListener('resize', onScroll);
		disconnectFadeIns?.();
	};
}
