export const THEME_COOKIE = 'rnracing-theme';
export type Theme = 'light' | 'dark';

function getThemeFromCookie(cookieString: string): Theme {
	const match = cookieString.match(new RegExp(`(?:^|; )${THEME_COOKIE}=([^;]*)`));
	const value = match ? decodeURIComponent(match[1]) : null;
	return value === 'dark' ? 'dark' : 'light';
}

function setThemeCookie(theme: Theme) {
	const maxAge = 60 * 60 * 24 * 365;
	document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function setTheme(theme: Theme) {
	document.documentElement.dataset.theme = theme;
	setThemeCookie(theme);
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
