export type GalleryOrientation = 'portrait' | 'landscape' | 'square';

export type GalleryTemplateId =
	| 'hero'
	| 'stack-2'
	| 'side-2'
	| 'hero-land-2'
	| 'hero-port-2'
	| 'three-balance'
	| 'grid-4';

export interface GalleryImageMeta {
	index: number;
	src: string;
	width: number;
	height: number;
	aspectRatio: number;
	orientation: GalleryOrientation;
}

export interface GallerySlotPlacement {
	photo: GalleryImageMeta;
	/** CSS grid area name matching the template. */
	area: string;
	objectFit: 'cover' | 'contain';
}

export interface GalleryPageLayout {
	photos: GalleryImageMeta[];
	template: GalleryTemplateId;
	slots: GallerySlotPlacement[];
}

export interface GalleryLayoutOptions {
	pageWidth: number;
	pageHeight: number;
	mode: 'single' | 'spread';
}

/**
 * Physical page ratio: width / height.
 * A desktop spread is two of these portrait pages side by side.
 */
export const PAGE_ASPECT = 1100 / 1600;

export interface PageGeometry {
	pageWidth: number;
	pageHeight: number;
	padding: number;
	pageNumberHeight: number;
	pageNumberGap: number;
	collageGap: number;
	photoPad: number;
	photoBorder: number;
	usableWidth: number;
	usableHeight: number;
}

/**
 * Chrome shared with gallery.css. The book applies these as CSS variables
 * so layout scoring and the rendered content rectangle stay the same.
 */
export function pageGeometry(pageWidth: number, pageHeight: number): PageGeometry {
	const padding = Math.round(clamp(pageWidth * 0.042, 12, 22));
	const pageNumberHeight = 16;
	const pageNumberGap = 8;
	const collageGap = Math.round(clamp(pageWidth * 0.02, 6, 12));
	const photoPad = Math.round(clamp(pageWidth * 0.016, 4, 10));
	const photoBorder = 2;
	const usableWidth = Math.max(1, pageWidth - padding * 2);
	const usableHeight = Math.max(1, pageHeight - padding * 2 - pageNumberHeight - pageNumberGap);
	return {
		pageWidth,
		pageHeight,
		padding,
		pageNumberHeight,
		pageNumberGap,
		collageGap,
		photoPad,
		photoBorder,
		usableWidth,
		usableHeight,
	};
}

interface SlotDef {
	area: string;
	col: number;
	row: number;
	colSpan: number;
	rowSpan: number;
	preferred: GalleryOrientation | 'any';
}

interface TemplateDef {
	id: GalleryTemplateId;
	/** Must match the CSS grid tracks in gallery.css */
	columns: number[];
	rows: number[];
	slots: SlotDef[];
}

const TEMPLATES: TemplateDef[] = [
	{
		id: 'hero',
		columns: [1],
		rows: [1],
		slots: [{ area: 'a', col: 0, row: 0, colSpan: 1, rowSpan: 1, preferred: 'any' }],
	},
	{
		id: 'stack-2',
		columns: [1],
		rows: [1, 1],
		slots: [
			{ area: 'a', col: 0, row: 0, colSpan: 1, rowSpan: 1, preferred: 'landscape' },
			{ area: 'b', col: 0, row: 1, colSpan: 1, rowSpan: 1, preferred: 'landscape' },
		],
	},
	{
		id: 'side-2',
		columns: [1, 1],
		rows: [1],
		slots: [
			{ area: 'a', col: 0, row: 0, colSpan: 1, rowSpan: 1, preferred: 'portrait' },
			{ area: 'b', col: 1, row: 0, colSpan: 1, rowSpan: 1, preferred: 'portrait' },
		],
	},
	{
		id: 'hero-land-2',
		columns: [1, 1],
		rows: [1.35, 0.9],
		slots: [
			{ area: 'a', col: 0, row: 0, colSpan: 2, rowSpan: 1, preferred: 'landscape' },
			{ area: 'b', col: 0, row: 1, colSpan: 1, rowSpan: 1, preferred: 'any' },
			{ area: 'c', col: 1, row: 1, colSpan: 1, rowSpan: 1, preferred: 'any' },
		],
	},
	{
		id: 'hero-port-2',
		columns: [1.2, 0.9],
		rows: [1, 1],
		slots: [
			{ area: 'a', col: 0, row: 0, colSpan: 1, rowSpan: 2, preferred: 'portrait' },
			{ area: 'b', col: 1, row: 0, colSpan: 1, rowSpan: 1, preferred: 'any' },
			{ area: 'c', col: 1, row: 1, colSpan: 1, rowSpan: 1, preferred: 'any' },
		],
	},
	{
		id: 'three-balance',
		columns: [1, 1],
		rows: [1.15, 0.85],
		slots: [
			{ area: 'a', col: 0, row: 0, colSpan: 1, rowSpan: 1, preferred: 'any' },
			{ area: 'b', col: 1, row: 0, colSpan: 1, rowSpan: 1, preferred: 'any' },
			{ area: 'c', col: 0, row: 1, colSpan: 2, rowSpan: 1, preferred: 'landscape' },
		],
	},
	{
		id: 'grid-4',
		columns: [1, 1],
		rows: [1, 1],
		slots: [
			{ area: 'a', col: 0, row: 0, colSpan: 1, rowSpan: 1, preferred: 'any' },
			{ area: 'b', col: 1, row: 0, colSpan: 1, rowSpan: 1, preferred: 'any' },
			{ area: 'c', col: 0, row: 1, colSpan: 1, rowSpan: 1, preferred: 'any' },
			{ area: 'd', col: 1, row: 1, colSpan: 1, rowSpan: 1, preferred: 'any' },
		],
	},
];

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

export function orientationFromAspect(aspectRatio: number): GalleryOrientation {
	if (aspectRatio < 0.85) return 'portrait';
	if (aspectRatio > 1.2) return 'landscape';
	return 'square';
}

export function createImageMeta(
	index: number,
	src: string,
	width: number,
	height: number,
): GalleryImageMeta {
	const safeW = Math.max(1, width);
	const safeH = Math.max(1, height);
	const aspectRatio = safeW / safeH;
	return {
		index,
		src,
		width: safeW,
		height: safeH,
		aspectRatio,
		orientation: orientationFromAspect(aspectRatio),
	};
}

function maxPhotosForGeometry(geo: PageGeometry): number {
	const shortSide = Math.min(geo.usableWidth, geo.usableHeight);
	if (shortSide < 250 || geo.usableHeight < 340) return 2;
	if (shortSide < 340 || geo.usableHeight < 480) return 3;
	return 4;
}

function trackSpan(tracks: number[], index: number, span: number, total: number, gap: number) {
	const sum = tracks.reduce((totalFr, fr) => totalFr + fr, 0);
	const free = total - gap * Math.max(0, tracks.length - 1);
	let size = 0;
	for (let i = 0; i < span; i += 1) {
		size += ((tracks[index + i] ?? 0) / sum) * free;
	}
	if (span > 1) size += gap * (span - 1);
	return size;
}

/** Image box inside the photo button, matching CSS padding and border. */
function slotFrame(template: TemplateDef, slot: SlotDef, geo: PageGeometry) {
	const cellW = trackSpan(template.columns, slot.col, slot.colSpan, geo.usableWidth, geo.collageGap);
	const cellH = trackSpan(template.rows, slot.row, slot.rowSpan, geo.usableHeight, geo.collageGap);
	const inset = geo.photoPad * 2 + geo.photoBorder;
	return {
		w: Math.max(1, cellW - inset),
		h: Math.max(1, cellH - inset),
	};
}

function cropAmount(imageAspect: number, frameAspect: number): number {
	if (imageAspect <= 0 || frameAspect <= 0) return 1;
	if (imageAspect > frameAspect) return 1 - frameAspect / imageAspect;
	return 1 - imageAspect / frameAspect;
}

function chooseObjectFit(imageAspect: number, frameAspect: number): 'cover' | 'contain' {
	return cropAmount(imageAspect, frameAspect) <= 0.22 ? 'cover' : 'contain';
}

function scoreSlot(
	photo: GalleryImageMeta,
	slot: SlotDef,
	template: TemplateDef,
	geo: PageGeometry,
): { score: number; objectFit: 'cover' | 'contain' } {
	const frame = slotFrame(template, slot, geo);
	const frameAspect = frame.w / frame.h;
	const crop = cropAmount(photo.aspectRatio, frameAspect);
	const objectFit = chooseObjectFit(photo.aspectRatio, frameAspect);
	const area = (frame.w * frame.h) / Math.max(1, geo.usableWidth * geo.usableHeight);
	const minEdge = Math.min(frame.w, frame.h);

	let score = 0.45;
	score += Math.min(area, 1) * 0.3;

	if (slot.preferred !== 'any') {
		if (photo.orientation === slot.preferred) score += 0.2;
		else if (photo.orientation === 'square') score += 0.05;
		else score -= 0.22;
	}

	if (objectFit === 'cover') score -= crop * 0.85;
	else score -= Math.min(0.4, crop * 0.45);

	if (area < 0.18) score -= 0.2;
	if (area < 0.12) score -= 0.32;
	if (minEdge < 150) score -= 0.28;
	if (minEdge < 110) score -= 0.45;

	return { score, objectFit };
}

function compatibilityBonus(template: TemplateDef, photos: GalleryImageMeta[]): number {
	const orientations = photos.map((photo) => photo.orientation);

	switch (template.id) {
		case 'stack-2': {
			const lands = orientations.filter((orientation) => orientation === 'landscape').length;
			if (lands === 2) return 0.46;
			if (lands === 1 && orientations.includes('square')) return 0.16;
			return -0.16;
		}
		case 'side-2': {
			const ports = orientations.filter((orientation) => orientation === 'portrait' || orientation === 'square').length;
			if (ports === 2) return 0.42;
			if (orientations[0] === orientations[1]) return 0.1;
			return -0.2;
		}
		case 'hero-land-2': {
			if (photos[0]?.orientation === 'landscape') return 0.32;
			if (photos[0]?.orientation === 'square') return 0.1;
			return -0.14;
		}
		case 'hero-port-2': {
			if (photos[0]?.orientation === 'portrait') return 0.34;
			if (photos[0]?.orientation === 'square') return 0.1;
			return -0.14;
		}
		case 'three-balance': {
			const lands = orientations.filter((orientation) => orientation === 'landscape').length;
			return lands >= 1 ? 0.2 : 0.06;
		}
		case 'grid-4': {
			const lands = orientations.filter((orientation) => orientation === 'landscape').length;
			if (lands >= 3) return -0.34;
			const tinyRisk = photos.some((photo) => photo.aspectRatio > 2.1 || photo.aspectRatio < 0.5);
			return tinyRisk ? -0.24 : 0.06;
		}
		case 'hero': {
			const photo = photos[0]!;
			if (photo.aspectRatio >= 1.85 || photo.aspectRatio <= 0.58) return 0.26;
			if (photo.aspectRatio >= 1.55 || photo.aspectRatio <= 0.7) return 0.08;
			return -0.12;
		}
		default:
			return 0;
	}
}

function scoreTemplate(
	template: TemplateDef,
	photos: GalleryImageMeta[],
	geo: PageGeometry,
): { score: number; slots: GallerySlotPlacement[] } | null {
	if (photos.length !== template.slots.length) return null;

	const slots: GallerySlotPlacement[] = [];
	let total = 0;
	let minSlotScore = Infinity;
	let minEdge = Infinity;

	for (let i = 0; i < template.slots.length; i += 1) {
		const slot = template.slots[i]!;
		const photo = photos[i]!;
		const frame = slotFrame(template, slot, geo);
		const rated = scoreSlot(photo, slot, template, geo);
		slots.push({ photo, area: slot.area, objectFit: rated.objectFit });
		total += rated.score;
		minSlotScore = Math.min(minSlotScore, rated.score);
		minEdge = Math.min(minEdge, frame.w, frame.h);
	}

	let score = total / photos.length;
	score += compatibilityBonus(template, photos);

	if (photos.length === 2) score += 0.06;
	if (photos.length === 3) score += 0.05;
	if (photos.length === 4) score += minEdge >= 170 ? 0.02 : -0.2;

	if (minSlotScore < 0.12) score -= 0.45;
	if (minEdge < 120) score -= 0.35;

	return { score, slots };
}

function bestLayoutForGroup(
	photos: GalleryImageMeta[],
	geo: PageGeometry,
): { score: number; layout: GalleryPageLayout } | null {
	let best: { score: number; layout: GalleryPageLayout } | null = null;

	for (const template of TEMPLATES) {
		const rated = scoreTemplate(template, photos, geo);
		if (!rated) continue;
		if (!best || rated.score > best.score) {
			best = {
				score: rated.score,
				layout: {
					photos: [...photos],
					template: template.id,
					slots: rated.slots,
				},
			};
		}
	}

	return best;
}

/**
 * Deterministic photo-book packer. Preserves input order; only groups consecutive images.
 */
export function createGalleryLayout(
	images: GalleryImageMeta[],
	options: GalleryLayoutOptions,
): GalleryPageLayout[] {
	if (images.length === 0) return [];

	const geo = pageGeometry(options.pageWidth, options.pageHeight);
	const maxPhotos = maxPhotosForGeometry(geo);
	const pages: GalleryPageLayout[] = [];
	let cursor = 0;

	while (cursor < images.length) {
		const remaining = images.length - cursor;
		const limit = Math.min(maxPhotos, remaining);
		let best: { score: number; layout: GalleryPageLayout; count: number } | null = null;

		for (let count = 1; count <= limit; count += 1) {
			const group = images.slice(cursor, cursor + count);
			const candidate = bestLayoutForGroup(group, geo);
			if (!candidate) continue;

			const adjusted = candidate.score + count * 0.012;
			if (!best || adjusted > best.score) {
				best = { score: adjusted, layout: candidate.layout, count };
			}
		}

		if (!best) {
			const photo = images[cursor]!;
			pages.push({
				photos: [photo],
				template: 'hero',
				slots: [{ photo, area: 'a', objectFit: 'contain' }],
			});
			cursor += 1;
			continue;
		}

		pages.push(best.layout);
		cursor += best.count;
	}

	return pages;
}

/** Find the photo-page index that contains a given gallery image index. */
export function findPageForPhoto(pages: GalleryPageLayout[], photoIndex: number): number {
	const idx = pages.findIndex((page) => page.photos.some((photo) => photo.index === photoIndex));
	return idx < 0 ? 0 : idx;
}
