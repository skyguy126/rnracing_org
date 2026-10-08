import { pinSafariChrome, watchSafariChrome } from './theme';

const MOBILE_NAV_QUERY = '(max-width: 959px)';
const HOVER_OPEN_MS = 80;
const HOVER_CLOSE_MS = 180;

export function initNavMenu(root: HTMLElement) {
	const toggle = root.querySelector<HTMLButtonElement>('.nav-menu-toggle');
	const panel = root.querySelector<HTMLElement>('.nav-menu-panel');
	const inlineLinks = root.querySelector<HTMLElement>('.nav-links--inline');
	const dropdowns = [...root.querySelectorAll<HTMLElement>('[data-nav-dropdown]')];
	const accordionTriggers = [
		...root.querySelectorAll<HTMLButtonElement>('.nav-accordion-trigger'),
	];

	if (!toggle || !panel) return;

	watchSafariChrome();

	const canHover = () =>
		window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	const prefersReducedMotion = () =>
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* —— Mobile panel —— */
	const closeMobile = () => {
		panel.hidden = true;
		toggle.setAttribute('aria-expanded', 'false');
		toggle.setAttribute('aria-label', 'Open menu');
		document.body.classList.remove('nav-menu-open');
		pinSafariChrome();
	};

	const openMobile = () => {
		closeAllDesktopDropdowns();
		panel.hidden = false;
		toggle.setAttribute('aria-expanded', 'true');
		toggle.setAttribute('aria-label', 'Close menu');
		document.body.classList.add('nav-menu-open');
		pinSafariChrome();
	};

	toggle.addEventListener('click', () => {
		if (panel.hidden) openMobile();
		else closeMobile();
	});

	panel.querySelectorAll<HTMLAnchorElement>('a.nav-link').forEach((link) => {
		link.addEventListener('click', closeMobile);
	});

	/* —— Desktop dropdowns —— */
	let openDropdown: HTMLElement | null = null;
	let openTimer = 0;
	let closeTimer = 0;

	const clearTimers = () => {
		window.clearTimeout(openTimer);
		window.clearTimeout(closeTimer);
	};

	const setDropdownOpen = (item: HTMLElement, open: boolean) => {
		const trigger = item.querySelector<HTMLButtonElement>('.nav-dropdown-trigger');
		const menu = item.querySelector<HTMLElement>('.nav-dropdown-panel');
		if (!trigger || !menu) return;

		item.classList.toggle('is-open', open);
		trigger.setAttribute('aria-expanded', open ? 'true' : 'false');

		if (open) {
			menu.hidden = false;
			// Force reflow so the enter transition runs after unhiding
			void menu.offsetWidth;
			menu.classList.add('is-visible');
		} else {
			menu.classList.remove('is-visible');
			const finish = () => {
				if (!item.classList.contains('is-open')) menu.hidden = true;
			};
			if (prefersReducedMotion()) {
				finish();
			} else {
				menu.addEventListener('transitionend', finish, { once: true });
				window.setTimeout(finish, 220);
			}
		}
	};

	const closeAllDesktopDropdowns = () => {
		clearTimers();
		for (const item of dropdowns) {
			if (item.classList.contains('is-open')) setDropdownOpen(item, false);
		}
		openDropdown = null;
	};

	const openDesktopDropdown = (item: HTMLElement) => {
		clearTimers();
		if (openDropdown && openDropdown !== item) {
			setDropdownOpen(openDropdown, false);
		}
		setDropdownOpen(item, true);
		openDropdown = item;
	};

	const scheduleOpen = (item: HTMLElement) => {
		clearTimers();
		if (openDropdown === item) return;
		openTimer = window.setTimeout(() => openDesktopDropdown(item), HOVER_OPEN_MS);
	};

	const scheduleClose = () => {
		clearTimers();
		closeTimer = window.setTimeout(closeAllDesktopDropdowns, HOVER_CLOSE_MS);
	};

	for (const item of dropdowns) {
		const trigger = item.querySelector<HTMLButtonElement>('.nav-dropdown-trigger');
		if (!trigger) continue;

		trigger.addEventListener('click', (event) => {
			event.preventDefault();
			event.stopPropagation();
			if (item.classList.contains('is-open')) {
				closeAllDesktopDropdowns();
			} else {
				openDesktopDropdown(item);
			}
		});

		item.addEventListener('pointerenter', (event) => {
			if (event.pointerType === 'touch') return;
			if (!canHover()) return;
			scheduleOpen(item);
		});

		item.addEventListener('pointerleave', (event) => {
			if (event.pointerType === 'touch') return;
			if (!canHover()) return;
			scheduleClose();
		});

		item.addEventListener('focusin', () => {
			openDesktopDropdown(item);
		});

		item.addEventListener('focusout', (event) => {
			const next = event.relatedTarget as Node | null;
			if (next && item.contains(next)) return;
			scheduleClose();
		});

		item.querySelectorAll<HTMLAnchorElement>('.nav-dropdown-link').forEach((link) => {
			link.addEventListener('click', closeAllDesktopDropdowns);
		});
	}

	/* —— Mobile accordions —— */
	const setAccordion = (trigger: HTMLButtonElement, open: boolean) => {
		const id = trigger.getAttribute('aria-controls');
		const region = id ? root.querySelector<HTMLElement>(`#${CSS.escape(id)}`) : null;
		const item = trigger.closest<HTMLElement>('.nav-accordion');
		if (!region || !item) return;

		trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
		item.classList.toggle('is-open', open);
		if (open) region.removeAttribute('inert');
		else region.setAttribute('inert', '');
	};

	for (const trigger of accordionTriggers) {
		trigger.addEventListener('click', () => {
			const willOpen = trigger.getAttribute('aria-expanded') !== 'true';
			// One open accordion at a time (cleaner mobile scan)
			for (const other of accordionTriggers) {
				if (other !== trigger) setAccordion(other, false);
			}
			setAccordion(trigger, willOpen);
		});
	}

	/* —— Global dismiss —— */
	document.addEventListener('keydown', (event) => {
		if (event.key !== 'Escape') return;
		if (!panel.hidden) {
			closeMobile();
			toggle.focus();
			return;
		}
		if (openDropdown) {
			const trigger = openDropdown.querySelector<HTMLButtonElement>('.nav-dropdown-trigger');
			closeAllDesktopDropdowns();
			trigger?.focus();
		}
	});

	document.addEventListener(
		'pointerdown',
		(event) => {
			if (!openDropdown) return;
			const target = event.target as Node | null;
			if (target && openDropdown.contains(target)) return;
			closeAllDesktopDropdowns();
		},
		true,
	);

	/* —— Collapse-to-hamburger when inline nav wraps —— */
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
		if (!wrapped) closeMobile();
		else closeAllDesktopDropdowns();
	};

	let frame = 0;
	const scheduleCollapse = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(syncCollapse);
	};

	scheduleCollapse();
	mobileQuery.addEventListener('change', () => {
		closeAllDesktopDropdowns();
		closeMobile();
		scheduleCollapse();
	});
	window.addEventListener('resize', scheduleCollapse);
	document.fonts?.ready.then(scheduleCollapse);

	const observer = new ResizeObserver(scheduleCollapse);
	for (const selector of ['.nav', '.brand', '.theme-toggle']) {
		const target = root.querySelector(selector);
		if (target) observer.observe(target);
	}

	return () => {
		closeMobile();
		closeAllDesktopDropdowns();
	};
}
