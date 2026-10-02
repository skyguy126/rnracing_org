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

/** Cookie holding the dojo save: best score is the whole game state the store reads. */
const STORE_COOKIE = 'rnracing-store';
/** Previous localStorage key, read once so an existing best is not lost. */
const LEGACY_SCORE_KEY = 'rnracing-best-score';
const STORE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type StoreSave = {
	score: number;
};

function floorScore(value: unknown): number {
	const score = Number(value);
	return Number.isFinite(score) && score > 0 ? Math.floor(score) : 0;
}

function readStoreCookie(): string | null {
	const match = document.cookie.match(new RegExp(`(?:^|; )${STORE_COOKIE}=([^;]*)`));
	return match ? decodeURIComponent(match[1]) : null;
}

function parseStoreSave(raw: string | null): StoreSave {
	if (!raw) return { score: 0 };
	try {
		const parsed = JSON.parse(raw) as { score?: unknown };
		return { score: floorScore(parsed.score) };
	} catch {
		return { score: floorScore(raw) };
	}
}

function writeStoreSave(save: StoreSave) {
	const value = encodeURIComponent(JSON.stringify({ score: save.score }));
	document.cookie = `${STORE_COOKIE}=${value}; path=/; max-age=${STORE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function readLegacyScore(): number {
	try {
		return floorScore(window.localStorage.getItem(LEGACY_SCORE_KEY));
	} catch {
		return 0;
	}
}

export function readBestScore(): number {
	try {
		const saved = parseStoreSave(readStoreCookie()).score;
		if (saved > 0) return saved;
		const legacy = readLegacyScore();
		if (legacy > 0) {
			writeStoreSave({ score: legacy });
			return legacy;
		}
		return 0;
	} catch {
		return 0;
	}
}

/** Saves `score` if it beats the stored best. Returns the resulting best. */
export function recordScore(score: number): number {
	const best = readBestScore();
	const next = Math.floor(score);
	if (next <= best) return best;
	try {
		writeStoreSave({ score: next });
	} catch {
		/* cookie blocked — best only lasts this page view */
	}
	return next;
}

/** Clears the saved score so the store locks again. */
export function resetStoreSave(): void {
	try {
		document.cookie = `${STORE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
		window.localStorage.removeItem(LEGACY_SCORE_KEY);
	} catch {
		/* storage blocked */
	}
}
