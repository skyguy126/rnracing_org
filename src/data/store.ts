/** Digital goods bought with store credit earned in the Fruit Ninja game on /design. */
export const STORE_ITEMS = [
	{
		id: 'ninja-hood-ornament',
		name: 'Ninja Hood Ornament',
		blurb: 'Print-ready STL of the official RN Racing ninja hood ornament. Bolts on. Probably. Torque spec: it don\'t matter.',
		kind: '3D model · STL',
		cost: 400,
		file: '/store/ninja-hood-ornament.stl',
		thumb: null,
		lightPreview: false,
	},
	{
		id: 'ninja-banana-bread',
		name: 'Ninja Banana Bread',
		blurb: 'The dojo\'s chocolate chip banana bread, on parchment. Ten slices. No blade required.',
		kind: 'Recipe · HTML',
		cost: 200,
		file: '/store/ninja-banana-bread.html',
		thumb: '/store/thumbs/ninja-banana-bread.jpg',
		lightPreview: false,
	},
	{
		id: 'secret-ingredient',
		name: 'The Secret Ingredient',
		blurb: 'The one thing every Ninja Banana Bread needs and no recipe card will tell you. Only true masters may know.',
		kind: 'Secret · HTML',
		cost: 2000,
		file: '/store/secret-ingredient.html',
		thumb: '/store/thumbs/secret-ingredient.jpg',
		lightPreview: false,
	},
	{
		id: 'fruit-ninja-desktop-saver',
		name: 'Fruit Ninja Desktop Saver',
		blurb: 'Full-resolution RN Racing Fruit Ninja wallpaper. Your desktop deserves to be sliced.',
		kind: 'Wallpaper · PNG',
		cost: 200,
		file: '/store/rnracing-fruit-ninja-desktop-saver.png',
		thumb: '/store/thumbs/rnracing-fruit-ninja-desktop-saver.jpg',
		lightPreview: false,
	},
	{
		id: 'rn-initials-logo',
		name: 'RN Initials Logo',
		blurb: 'The RN initials mark with a transparent background. Stickers, avatars, illegal tattoos.',
		kind: 'Logo · PNG',
		cost: 80,
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
		cost: 80,
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

/** localStorage key holding the dojo save, so credit and high scores survive closing the browser. */
const STORE_KEY = 'rnracing-store';
/** Older saves: a cookie with the best run, and before that a bare localStorage best. */
const LEGACY_COOKIE = 'rnracing-store';
const LEGACY_SCORE_KEY = 'rnracing-best-score';

/** How many runs the high score table keeps. */
export const HIGH_SCORE_LIMIT = 5;

export type HighScore = {
	score: number;
	/** When the run ended, as epoch milliseconds. */
	at: number;
};

export type StoreSave = {
	/** Store credit: every point ever sliced, minus what has been spent. */
	credit: number;
	/** Highest single-run score, kept up to date mid-run. */
	best: number;
	/** Top finished runs, highest first. */
	highScores: HighScore[];
	/** Ids of items already bought. */
	owned: string[];
};

function floorScore(value: unknown): number {
	const score = Number(value);
	return Number.isFinite(score) && score > 0 ? Math.floor(score) : 0;
}

function blankSave(): StoreSave {
	return { credit: 0, best: 0, highScores: [], owned: [] };
}

/** Reads the pre-credit saves once; an old best run becomes the opening credit. */
function readLegacyBest(): number {
	let best = 0;
	try {
		const match = document.cookie.match(new RegExp(`(?:^|; )${LEGACY_COOKIE}=([^;]*)`));
		if (match) {
			const raw = decodeURIComponent(match[1]);
			try {
				best = floorScore((JSON.parse(raw) as { score?: unknown }).score);
			} catch {
				best = floorScore(raw);
			}
		}
	} catch {
		/* cookies blocked */
	}
	try {
		best = Math.max(best, floorScore(window.localStorage.getItem(LEGACY_SCORE_KEY)));
	} catch {
		/* storage blocked */
	}
	return best;
}

function clearLegacy() {
	try {
		document.cookie = `${LEGACY_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
		window.localStorage.removeItem(LEGACY_SCORE_KEY);
	} catch {
		/* storage blocked */
	}
}

/** In-memory copy for when localStorage is blocked: credit then lasts this page view. */
let memorySave: StoreSave | null = null;

function writeSave(save: StoreSave) {
	memorySave = save;
	try {
		window.localStorage.setItem(STORE_KEY, JSON.stringify(save));
	} catch {
		/* storage blocked */
	}
}

export function readSave(): StoreSave {
	let raw: string | null = null;
	try {
		raw = window.localStorage.getItem(STORE_KEY);
	} catch {
		return memorySave ?? blankSave();
	}
	if (raw) {
		try {
			const parsed = JSON.parse(raw) as Partial<StoreSave> & { bank?: unknown };
			const highScores = Array.isArray(parsed.highScores)
				? parsed.highScores
						.map((run) => ({ score: floorScore(run?.score), at: Number(run?.at) || 0 }))
						.filter((run) => run.score > 0)
						.slice(0, HIGH_SCORE_LIMIT)
				: [];
			return {
				// `bank` is what the first version of this save called credit.
				credit: floorScore(parsed.credit ?? parsed.bank),
				best: Math.max(floorScore(parsed.best), highScores[0]?.score ?? 0),
				highScores,
				owned: Array.isArray(parsed.owned) ? parsed.owned.filter((id) => typeof id === 'string') : [],
			};
		} catch {
			/* corrupt save: fall through to migration */
		}
	}
	const legacy = readLegacyBest();
	const save: StoreSave = { credit: legacy, best: legacy, highScores: [], owned: [] };
	if (legacy > 0) {
		writeSave(save);
		clearLegacy();
	}
	return save;
}

/** Adds `points` sliced to store credit and raises the best run to `runScore` if it beats it. */
export function earnCredit(points: number, runScore: number): StoreSave {
	const save = readSave();
	save.credit += floorScore(points);
	save.best = Math.max(save.best, floorScore(runScore));
	writeSave(save);
	return save;
}

/** Enters a finished run in the high score table. Returns the save and the run's place (1-based), or 0 if it missed the table. */
export function recordRun(score: number): { save: StoreSave; place: number } {
	const save = readSave();
	const run = { score: floorScore(score), at: Date.now() };
	if (run.score === 0) return { save, place: 0 };
	const table = [...save.highScores, run].sort((a, b) => b.score - a.score || a.at - b.at);
	save.highScores = table.slice(0, HIGH_SCORE_LIMIT);
	save.best = Math.max(save.best, run.score);
	writeSave(save);
	return { save, place: save.highScores.indexOf(run) + 1 };
}

/** Spends store credit on an item. Returns the new save, or null if it is owned or unaffordable. */
export function buyItem(id: string): StoreSave | null {
	const item = STORE_ITEMS.find((entry) => entry.id === id);
	const save = readSave();
	if (!item || save.owned.includes(id) || save.credit < item.cost) return null;
	save.credit -= item.cost;
	save.owned.push(id);
	writeSave(save);
	return save;
}

/** Clears store credit, high scores and purchases. */
export function resetStoreSave(): void {
	memorySave = null;
	try {
		window.localStorage.removeItem(STORE_KEY);
	} catch {
		/* storage blocked */
	}
	clearLegacy();
}
