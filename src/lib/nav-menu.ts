export function initNavMenu(root: HTMLElement) {
	const toggle = root.querySelector<HTMLButtonElement>('.nav-menu-toggle');
	const panel = root.querySelector<HTMLElement>('.nav-menu-panel');

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

	return close;
}
