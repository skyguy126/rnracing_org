declare module 'page-flip' {
	export type FlipCorner = 'top' | 'bottom';
	export type PageFlipOrientation = 'portrait' | 'landscape';
	export type PageFlipState = 'user_fold' | 'fold_corner' | 'flipping' | 'read';

	export interface PageFlipSettings {
		width: number;
		height: number;
		size?: 'fixed' | 'stretch';
		minWidth?: number;
		maxWidth?: number;
		minHeight?: number;
		maxHeight?: number;
		drawShadow?: boolean;
		flippingTime?: number;
		usePortrait?: boolean;
		startZIndex?: number;
		startPage?: number;
		autoSize?: boolean;
		maxShadowOpacity?: number;
		showCover?: boolean;
		mobileScrollSupport?: boolean;
		swipeDistance?: number;
		clickEventForward?: boolean;
		useMouseEvents?: boolean;
		showPageCorners?: boolean;
		disableFlipByClick?: boolean;
	}

	export interface PageFlipEvent<T = unknown> {
		data: T;
		object: PageFlip;
	}

	export class PageFlip {
		constructor(element: HTMLElement, settings: Partial<PageFlipSettings>);
		destroy(): void;
		update(): void;
		loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
		updateFromHtml(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
		turnToPrevPage(): void;
		turnToNextPage(): void;
		turnToPage(pageNum: number): void;
		flipNext(corner?: FlipCorner): void;
		flipPrev(corner?: FlipCorner): void;
		flip(pageNum: number, corner?: FlipCorner): void;
		getPageCount(): number;
		getCurrentPageIndex(): number;
		getOrientation(): PageFlipOrientation;
		getState(): PageFlipState;
		on(event: 'flip', callback: (e: PageFlipEvent<number>) => void): this;
		on(event: 'changeOrientation', callback: (e: PageFlipEvent<PageFlipOrientation>) => void): this;
		on(event: 'changeState', callback: (e: PageFlipEvent<PageFlipState>) => void): this;
		on(
			event: 'init' | 'update',
			callback: (e: PageFlipEvent<{ page: number; mode: PageFlipOrientation }>) => void,
		): this;
		off(event: string): this;
	}
}

declare module 'page-flip/dist/js/page-flip.module.js' {
	export { PageFlip } from 'page-flip';
}
