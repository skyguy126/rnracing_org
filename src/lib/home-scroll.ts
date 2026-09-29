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

/** Loads the remaining story images one at a time so the first paint stays quick. */
function loadRemaining(frames: HTMLImageElement[]) {
	const pending = frames.filter((frame) => frame.dataset.src);

	const next = () => {
		const frame = pending.shift();
		if (!frame) return;
		const src = frame.dataset.src;
		delete frame.dataset.src;
		frame.addEventListener('load', next, { once: true });
		frame.addEventListener('error', next, { once: true });
		if (src) frame.src = src;
	};

	next();
}

export function initHomeScroll(root: HTMLElement) {
	const frames = Array.from(root.querySelectorAll<HTMLImageElement>('.home-scroll__frame'));
	const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-story-image]'));
	const loader = root.querySelector<HTMLElement>('.home-scroll__loader');
	if (!frames.length || !panels.length) return;

	let activeIndex = 0;
	let rafId = 0;

	const show = (index: number) => {
		if (index === activeIndex || !frames[index]) return;
		frames[activeIndex]?.classList.remove('is-active');
		frames[index].classList.add('is-active');
		activeIndex = index;
	};

	/** The panel whose centre sits closest to the middle of the viewport wins. */
	const updateFrame = () => {
		const viewportCenter = window.innerHeight / 2;
		let bestIndex = activeIndex;
		let bestDistance = Infinity;

		panels.forEach((panel) => {
			const rect = panel.getBoundingClientRect();
			const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
			if (distance < bestDistance) {
				bestDistance = distance;
				bestIndex = Number(panel.dataset.storyImage) - 1;
			}
		});

		show(bestIndex);
	};

	const onScroll = () => {
		cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(updateFrame);
	};

	const disconnectFadeIns = initFadeIns(root);

	const start = () => {
		loader?.remove();
		loadRemaining(frames);
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll, { passive: true });
		updateFrame();
	};

	if (frames[0].complete) {
		start();
	} else {
		frames[0].addEventListener('load', start, { once: true });
		frames[0].addEventListener(
			'error',
			() => {
				if (loader) loader.textContent = 'Unable to load photos';
			},
			{ once: true },
		);
	}

	return () => {
		cancelAnimationFrame(rafId);
		window.removeEventListener('scroll', onScroll);
		window.removeEventListener('resize', onScroll);
		disconnectFadeIns?.();
	};
}
