const MOBILE_NAV_QUERY = '(max-width: 959px)';

export function initNavMenu(root: HTMLElement) {
	const toggle = root.querySelector<HTMLButtonElement>('.nav-menu-toggle');
	const panel = root.querySelector<HTMLElement>('.nav-menu-panel');
	const inlineLinks = root.querySelector<HTMLElement>('.nav-links--inline');

	if (!toggle || !panel) return;

	const close = () => {
		panel.hidden = true;
		toggle.setAttribute('aria-expanded', 'false');
		toggle.setAttribute('aria-label', 'Open menu');
		document.body.classList.remove('nav-menu-open');
	};

	const open = () => {
		panel.hidden = false;
		toggle.setAttribute('aria-expanded', 'true');
		toggle.setAttribute('aria-label', 'Close menu');
		document.body.classList.add('nav-menu-open');
	};

	toggle.addEventListener('click', () => {
		if (panel.hidden) open();
		else close();
	});

	panel.querySelectorAll<HTMLAnchorElement>('.nav-link').forEach((link) => {
		link.addEventListener('click', close);
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !panel.hidden) close();
	});

	const mobileQuery = window.matchMedia(MOBILE_NAV_QUERY);

	const syncCollapse = () => {
		if (!inlineLinks || mobileQuery.matches) {
			root.classList.remove('is-nav-collapsed');
			return;
		}

		root.classList.remove('is-nav-collapsed');
		const items = [...inlineLinks.children] as HTMLElement[];
		const first = items[0];
		const wrapped = !!first && items.some((item) => item.offsetTop > first.offsetTop + 1);

		root.classList.toggle('is-nav-collapsed', wrapped);
		if (!wrapped) close();
	};

	let frame = 0;
	const scheduleCollapse = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(syncCollapse);
	};

	scheduleCollapse();
	mobileQuery.addEventListener('change', scheduleCollapse);
	window.addEventListener('resize', scheduleCollapse);
	document.fonts?.ready.then(scheduleCollapse);

	const observer = new ResizeObserver(scheduleCollapse);
	for (const selector of ['.nav', '.brand', '.theme-toggle']) {
		const target = root.querySelector(selector);
		if (target) observer.observe(target);
	}

	return close;
}
