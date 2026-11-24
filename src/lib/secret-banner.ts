/** Programmatic secret crew banner — no bitmap in the repo / search indexes. */

export type SecretBannerTheme = 'dark' | 'light';

const BG: Record<SecretBannerTheme, string> = {
	dark: '#1d4ed7',
	light: '#18181a',
};

const BLUE = '#0136b6';

function starPoints(cx: number, cy: number, r: number, pointing: 'up' | 'down') {
	const s3 = Math.sqrt(3);
	if (pointing === 'up') {
		return [
			[cx, cy - r],
			[cx - (r * s3) / 2, cy + r / 2],
			[cx + (r * s3) / 2, cy + r / 2],
		];
	}
	return [
		[cx, cy + r],
		[cx - (r * s3) / 2, cy - r / 2],
		[cx + (r * s3) / 2, cy - r / 2],
	];
}

function pointsAttr(points: number[][]) {
	return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

/** Square SVG: blue/dark mat + centered banner (stripes + hexagram). */
export function secretBannerSvg(
	theme: SecretBannerTheme,
	options: { className?: string; alt?: string; hidden?: boolean } = {},
) {
	const { className = 'crew-photo', alt = '', hidden = false } = options;
	const up = starPoints(539.5, 538, 105, 'up');
	const down = starPoints(539.5, 538, 105, 'down');
	const aria = alt ? `role="img" aria-label="${alt.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
	/* SVG often ignores the HTML hidden attribute; force display when needed. */
	const hiddenAttr = hidden ? ' hidden style="display:none"' : '';

	return `<svg class="${className}" data-theme-photo="${theme}" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg" ${aria}${hiddenAttr}>
	<rect width="1080" height="1080" fill="${BG[theme]}"/>
	<rect x="206" y="298" width="667" height="483" fill="#fff"/>
	<rect x="206" y="340" width="667" height="74" fill="${BLUE}"/>
	<rect x="206" y="662" width="667" height="74" fill="${BLUE}"/>
	<polygon points="${pointsAttr(up)}" fill="none" stroke="${BLUE}" stroke-width="18" stroke-linejoin="miter"/>
	<polygon points="${pointsAttr(down)}" fill="none" stroke="${BLUE}" stroke-width="18" stroke-linejoin="miter"/>
</svg>`;
}

export function secretBannerPhotoPair(options: {
	className?: string;
	alt?: string;
	hidden?: boolean;
} = {}) {
	const { className = 'crew-photo', alt = 'Portrait', hidden = false } = options;
	return (
		secretBannerSvg('dark', { className, alt, hidden }) +
		secretBannerSvg('light', { className, alt: '', hidden })
	);
}
