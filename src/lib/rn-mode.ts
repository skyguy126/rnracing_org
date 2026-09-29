export const RN_MODE_COOKIE = 'rnracing-rn-mode';
export const RN_MODE_EVENT = 'rn-mode-change';

export type RnModeChangeDetail = { enabled: boolean };

export function isRnModeEnabled(cookieString = typeof document !== 'undefined' ? document.cookie : ''): boolean {
	const match = cookieString.match(new RegExp(`(?:^|; )${RN_MODE_COOKIE}=([^;]*)`));
	return match ? decodeURIComponent(match[1]) === '1' : false;
}

function setRnModeCookie(enabled: boolean) {
	if (enabled) {
		// Session cookie — cleared when the browser session ends.
		document.cookie = `${RN_MODE_COOKIE}=1; path=/; SameSite=Lax`;
	} else {
		document.cookie = `${RN_MODE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
	}
}

function applyRnMode(enabled: boolean) {
	if (enabled) {
		document.documentElement.dataset.rnMode = '';
	} else {
		delete document.documentElement.dataset.rnMode;
	}
}

export function setRnMode(enabled: boolean) {
	applyRnMode(enabled);
	setRnModeCookie(enabled);
	document.dispatchEvent(
		new CustomEvent<RnModeChangeDetail>(RN_MODE_EVENT, { detail: { enabled } }),
	);
}

export function toggleRnMode() {
	setRnMode(!document.documentElement.hasAttribute('data-rn-mode'));
}

function isTypingTarget(el: EventTarget | null) {
	if (!(el instanceof HTMLElement)) return false;
	const tag = el.tagName;
	return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

/** Sync DOM from the session cookie and listen for the "n" toggle. Call once per page. */
let rnModeInitialized = false;

export function initRnMode() {
	applyRnMode(isRnModeEnabled());
	if (rnModeInitialized) return;
	rnModeInitialized = true;

	window.addEventListener('keydown', (event) => {
		if (event.key !== 'n' && event.key !== 'N') return;
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		if (isTypingTarget(event.target)) return;
		event.preventDefault();
		toggleRnMode();
	});
}
