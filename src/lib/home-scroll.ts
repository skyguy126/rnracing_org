const TOTAL_FRAMES = 169;

function frameSrc(index: number) {
	return `/frames/frame-${String(index + 1).padStart(3, '0')}.jpg`;
}

function scrollToFrame(scroll: number) {
	if (scroll <= 0.08) return 0;
	if (scroll <= 0.55) {
		const progress = (scroll - 0.08) / 0.47;
		return Math.round(progress * (TOTAL_FRAMES - 1));
	}
	if (scroll <= 0.88) {
		const progress = (scroll - 0.55) / 0.33;
		return Math.round((1 - progress) * (TOTAL_FRAMES - 1));
	}
	return 0;
}

function preloadFrames() {
	return Promise.all(
		Array.from({ length: TOTAL_FRAMES }, (_, index) => {
			return new Promise<HTMLImageElement>((resolve, reject) => {
				const image = new Image();
				image.onload = () => resolve(image);
				image.onerror = reject;
				image.src = frameSrc(index);
			});
		}),
	);
}

export function initHomeScroll(root: HTMLElement) {
	const canvas = root.querySelector<HTMLCanvasElement>('.home-scroll__canvas');
	const loader = root.querySelector<HTMLElement>('.home-scroll__loader');
	if (!canvas) return;

	const context = canvas.getContext('2d', { alpha: false });
	if (!context) return;

	let frames: HTMLImageElement[] = [];
	let lastFrame = -1;
	let rafId = 0;

	const paint = (frame: number) => {
		if (frame === lastFrame || !frames[frame]) return;
		lastFrame = frame;
		context.drawImage(frames[frame], 0, 0);
	};

	const updateFrame = () => {
		const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
		const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
		paint(scrollToFrame(Math.min(Math.max(progress, 0), 1)));
	};

	const onScroll = () => {
		cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(updateFrame);
	};

	preloadFrames()
		.then((images) => {
			frames = images;
			canvas.width = images[0].naturalWidth;
			canvas.height = images[0].naturalHeight;
			paint(0);
			loader?.remove();
			window.addEventListener('scroll', onScroll, { passive: true });
			updateFrame();
		})
		.catch(() => {
			if (loader) loader.textContent = 'Unable to load video frames';
		});

	return () => {
		cancelAnimationFrame(rafId);
		window.removeEventListener('scroll', onScroll);
	};
}
