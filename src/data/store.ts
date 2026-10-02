/** Digital goods unlocked by best score in the Fruit Ninja game on /design. */
export const STORE_ITEMS = [
	{
		id: 'ninja-hood-ornament',
		name: 'Ninja Hood Ornament',
		blurb: 'Print-ready STL of the official RN Racing ninja hood ornament. Bolts on. Probably. Torque spec: it don\'t matter.',
		kind: '3D model · STL',
		cost: 200,
		file: '/store/ninja-hood-ornament.stl',
		thumb: null,
		lightPreview: false,
	},
	{
		id: 'fruit-ninja-desktop-saver',
		name: 'Fruit Ninja Desktop Saver',
		blurb: 'Full-resolution RN Racing Fruit Ninja wallpaper. Your desktop deserves to be sliced.',
		kind: 'Wallpaper · PNG',
		cost: 100,
		file: '/store/rnracing-fruit-ninja-desktop-saver.png',
		thumb: '/store/thumbs/rnracing-fruit-ninja-desktop-saver.jpg',
		lightPreview: false,
	},
	{
		id: 'rn-initials-logo',
		name: 'RN Initials Logo',
		blurb: 'The RN initials mark with a transparent background. Stickers, avatars, illegal tattoos.',
		kind: 'Logo · PNG',
		cost: 40,
		file: '/store/rn-initials-logo.png',
		thumb: '/store/thumbs/rn-initials-logo.png',
		/** Transparent black artwork — preview it on a light backdrop. */
		lightPreview: true,
	},
	{
		id: 'rnracing-logo',
		name: 'RN Racing Logo',
		blurb: 'The full RN Racing team logo. Officially licensed by nobody.',
		kind: 'Logo · PNG',
		cost: 40,
		file: '/store/rnracing-logo.png',
		thumb: '/store/thumbs/rnracing-logo.png',
		lightPreview: true,
	},
] as const;

/** Dojo rules the store copy and the game both quote. */
export const GAME_RULES = {
	/** Unsliced lemons a player can drop before the run ends. */
	maxMisses: 5,
} as const;

/**
 * Store-wide "sale". Costs above are what players actually pay; the struck-through
 * list price is derived so that `percentOff` lands exactly on them.
 */
export const STORE_SALE = {
	percentOff: 99,
	reason: 'the 2026 Halloween Meets Gasoline award at Buttonwillow',
} as const;

export function listPrice(cost: number) {
	return Math.round((cost * 100) / (100 - STORE_SALE.percentOff));
}

const BEST_SCORE_KEY = 'rnracing-best-score';

export function readBestScore(): number {
	try {
		const value = Number(window.localStorage.getItem(BEST_SCORE_KEY));
		return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
	} catch {
		return 0;
	}
}

/** Saves `score` if it beats the stored best. Returns the resulting best. */
export function recordScore(score: number): number {
	const best = readBestScore();
	if (score <= best) return best;
	try {
		window.localStorage.setItem(BEST_SCORE_KEY, String(Math.floor(score)));
	} catch {
		/* storage blocked — best only lasts this page view */
	}
	return Math.floor(score);
}
