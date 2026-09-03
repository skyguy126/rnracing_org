export const THEME_COOKIE = 'rnracing-theme';
export type Theme = 'light' | 'dark';

/** Solid chrome colors matching `--bg` — used by iOS Safari status bar / Dynamic Island. */
export const THEME_CHROME: Record<Theme, string> = {
	light: '#fafafa',
	dark: '#09090b',
};

function applySafariChrome(theme: Theme) {
	const themeColor = document.querySelector('meta[name="theme-color"]');
	themeColor?.setAttribute('content', THEME_CHROME[theme]);

	const statusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
	statusBar?.setAttribute('content', theme === 'dark' ? 'black-translucent' : 'default');

	document.documentElement.style.colorScheme = theme;
}

function getThemeFromCookie(cookieString: string): Theme {
	const match = cookieString.match(new RegExp(`(?:^|; )${THEME_COOKIE}=([^;]*)`));
	const value = match ? decodeURIComponent(match[1]) : null;
	return value === 'light' ? 'light' : 'dark';
}

function setThemeCookie(theme: Theme) {
	const maxAge = 60 * 60 * 24 * 365;
	document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function setTheme(theme: Theme) {
	document.documentElement.dataset.theme = theme;
	setThemeCookie(theme);
	applySafariChrome(theme);
}

export function initThemeToggle(root: HTMLElement) {
	const buttons = root.querySelectorAll<HTMLButtonElement>('[data-theme-value]');

	const syncButtons = (theme: Theme) => {
		buttons.forEach((button) => {
			const isActive = button.dataset.themeValue === theme;
			button.classList.toggle('is-active', isActive);
			button.setAttribute('aria-pressed', String(isActive));
		});
	};

	syncButtons(getThemeFromCookie(document.cookie));

	buttons.forEach((button) => {
		button.addEventListener('click', () => {
			const theme = button.dataset.themeValue as Theme;
			setTheme(theme);
			syncButtons(theme);
		});
	});
}
