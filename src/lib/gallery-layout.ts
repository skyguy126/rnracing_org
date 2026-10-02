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

interface SlotDef {
	area: string;
	/** Relative width fraction of the usable mat. */
	w: number;
	/** Relative height fraction of the usable mat. */
	h: number;
	preferred: GalleryOrientation | 'any';
}

interface TemplateDef {
	id: GalleryTemplateId;
	slots: SlotDef[];
}

const TEMPLATES: TemplateDef[] = [
	{
		id: 'hero',
		slots: [{ area: 'a', w: 1, h: 1, preferred: 'any' }],
	},
	{
		id: 'stack-2',
		slots: [
			{ area: 'a', w: 1, h: 0.48, preferred: 'landscape' },
			{ area: 'b', w: 1, h: 0.48, preferred: 'landscape' },
		],
	},
	{
		id: 'side-2',
		slots: [
			{ area: 'a', w: 0.48, h: 1, preferred: 'portrait' },
			{ area: 'b', w: 0.48, h: 1, preferred: 'portrait' },
		],
	},
	{
		id: 'hero-land-2',
		slots: [
			{ area: 'a', w: 1, h: 0.58, preferred: 'landscape' },
			{ area: 'b', w: 0.48, h: 0.36, preferred: 'any' },
			{ area: 'c', w: 0.48, h: 0.36, preferred: 'any' },
		],
	},
	{
		id: 'hero-port-2',
		slots: [
			{ area: 'a', w: 0.56, h: 1, preferred: 'portrait' },
			{ area: 'b', w: 0.4, h: 0.48, preferred: 'any' },
			{ area: 'c', w: 0.4, h: 0.48, preferred: 'any' },
		],
	},
	{
		id: 'three-balance',
		slots: [
			{ area: 'a', w: 0.48, h: 0.58, preferred: 'any' },
			{ area: 'b', w: 0.48, h: 0.58, preferred: 'any' },
			{ area: 'c', w: 1, h: 0.36, preferred: 'landscape' },
		],
	},
	{
		id: 'grid-4',
		slots: [
			{ area: 'a', w: 0.48, h: 0.48, preferred: 'any' },
			{ area: 'b', w: 0.48, h: 0.48, preferred: 'any' },
			{ area: 'c', w: 0.48, h: 0.48, preferred: 'any' },
			{ area: 'd', w: 0.48, h: 0.48, preferred: 'any' },
		],
	},
];

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

function maxPhotosForGeometry(options: GalleryLayoutOptions): number {
	const area = options.pageWidth * options.pageHeight;
	if (options.pageWidth < 340 || area < 140_000) return 2;
	if (options.pageWidth < 420 || (options.mode === 'single' && options.pageWidth < 480)) return 3;
	return 4;
}

function slotAspect(pageWidth: number, pageHeight: number, slot: SlotDef): number {
	const usableW = pageWidth * 0.86;
	const usableH = pageHeight * 0.86;
	return (usableW * slot.w) / Math.max(1, usableH * slot.h);
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
	pageWidth: number,
	pageHeight: number,
): { score: number; objectFit: 'cover' | 'contain' } {
	const frameAspect = slotAspect(pageWidth, pageHeight, slot);
	const crop = cropAmount(photo.aspectRatio, frameAspect);
	const objectFit = chooseObjectFit(photo.aspectRatio, frameAspect);
	const area = slot.w * slot.h;

	let score = 0.5;
	score += Math.min(area, 1) * 0.28;

	if (slot.preferred !== 'any') {
		if (photo.orientation === slot.preferred) score += 0.2;
		else if (photo.orientation === 'square') score += 0.05;
		else score -= 0.2;
	}

	if (objectFit === 'cover') score -= crop * 0.75;
	else score -= Math.min(0.35, crop * 0.4);

	if (area < 0.2) score -= 0.22;
	if (area < 0.15) score -= 0.28;

	return { score, objectFit };
}

function compatibilityBonus(template: TemplateDef, photos: GalleryImageMeta[]): number {
	const orientations = photos.map((p) => p.orientation);

	switch (template.id) {
		case 'stack-2': {
			const lands = orientations.filter((o) => o === 'landscape').length;
			if (lands === 2) return 0.42;
			if (lands === 1 && orientations.includes('square')) return 0.18;
			return -0.15;
		}
		case 'side-2': {
			const ports = orientations.filter((o) => o === 'portrait' || o === 'square').length;
			if (ports === 2) return 0.42;
			if (orientations[0] === orientations[1]) return 0.12;
			return -0.18;
		}
		case 'hero-land-2': {
			if (photos[0]?.orientation === 'landscape') return 0.34;
			if (photos[0]?.orientation === 'square') return 0.12;
			return -0.12;
		}
		case 'hero-port-2': {
			if (photos[0]?.orientation === 'portrait') return 0.34;
			if (photos[0]?.orientation === 'square') return 0.1;
			return -0.12;
		}
		case 'three-balance': {
			const lands = orientations.filter((o) => o === 'landscape').length;
			return lands >= 1 ? 0.22 : 0.08;
		}
		case 'grid-4': {
			const tinyRisk = photos.some((p) => p.aspectRatio > 2.1 || p.aspectRatio < 0.5);
			return tinyRisk ? -0.2 : 0.16;
		}
		case 'hero': {
			const photo = photos[0]!;
			if (photo.aspectRatio >= 1.85 || photo.aspectRatio <= 0.58) return 0.28;
			if (photo.aspectRatio >= 1.55 || photo.aspectRatio <= 0.7) return 0.12;
			// Ordinary singles are fine but should lose to good multi packs
			return -0.08;
		}
		default:
			return 0;
	}
}

function scoreTemplate(
	template: TemplateDef,
	photos: GalleryImageMeta[],
	options: GalleryLayoutOptions,
): { score: number; slots: GallerySlotPlacement[] } | null {
	if (photos.length !== template.slots.length) return null;

	const slots: GallerySlotPlacement[] = [];
	let total = 0;
	let minSlotScore = Infinity;

	for (let i = 0; i < template.slots.length; i += 1) {
		const slot = template.slots[i]!;
		const photo = photos[i]!;
		const rated = scoreSlot(photo, slot, options.pageWidth, options.pageHeight);
		slots.push({ photo, area: slot.area, objectFit: rated.objectFit });
		total += rated.score;
		minSlotScore = Math.min(minSlotScore, rated.score);
	}

	let score = total / photos.length;
	score += compatibilityBonus(template, photos);

	// Soft preference for richer pages when slots stay healthy
	if (photos.length === 2) score += 0.08;
	if (photos.length === 3) score += 0.1;
	if (photos.length === 4) score += options.pageWidth >= 420 ? 0.04 : -0.08;

	if (minSlotScore < 0.15) score -= 0.4;
	if (photos.length === 4 && options.pageHeight < 400) score -= 0.22;

	return { score, slots };
}

function bestLayoutForGroup(
	photos: GalleryImageMeta[],
	options: GalleryLayoutOptions,
): { score: number; layout: GalleryPageLayout } | null {
	let best: { score: number; layout: GalleryPageLayout } | null = null;

	for (const template of TEMPLATES) {
		const rated = scoreTemplate(template, photos, options);
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

	const maxPhotos = maxPhotosForGeometry(options);
	const pages: GalleryPageLayout[] = [];
	let cursor = 0;

	while (cursor < images.length) {
		const remaining = images.length - cursor;
		const limit = Math.min(maxPhotos, remaining);
		let best: { score: number; layout: GalleryPageLayout; count: number } | null = null;

		for (let count = 1; count <= limit; count += 1) {
			const group = images.slice(cursor, cursor + count);
			const candidate = bestLayoutForGroup(group, options);
			if (!candidate) continue;

			// Slight preference to consume more when quality is comparable
			const adjusted = candidate.score + count * 0.01;

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

export function photoRangeLabel(page: GalleryPageLayout): string {
	const start = page.photos[0]?.index ?? 0;
	const end = page.photos[page.photos.length - 1]?.index ?? start;
	const a = String(start + 1).padStart(2, '0');
	const b = String(end + 1).padStart(2, '0');
	return start === end ? `Photo ${a}` : `Photos ${a}–${b}`;
}
