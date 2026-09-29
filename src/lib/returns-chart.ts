import {
	CHART_YEARS,
	FINAL_CAPTION,
	RETURN_SCENARIOS,
	YEAR_CAPTIONS,
	valueAt,
	type ReturnScenario,
} from '../data/investor-scenarios';

const SVG_NS = 'http://www.w3.org/2000/svg';

const VIEW_W = 640;
const VIEW_H = 340;
const PAD = { top: 16, right: 20, bottom: 34, left: 58 };
const PLOT_W = VIEW_W - PAD.left - PAD.right;
const PLOT_H = VIEW_H - PAD.top - PAD.bottom;

const DURATION_MS = 7000;
const SAMPLES_PER_YEAR = 12;

const usd = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	maximumFractionDigits: 0,
});

const easeInOut = (p: number) => 0.5 - Math.cos(Math.PI * p) / 2;

/** Pick a friendly y-axis maximum (as a multiple of the investment) and tick step. */
function computeAxis() {
	// Every line starts at 1x (your original money), so the axis always includes it.
	const maxMultiple = Math.max(
		1,
		...RETURN_SCENARIOS.map((s) => valueAt(1, s.annualRate, CHART_YEARS)),
	);
	const step = maxMultiple > 6 ? 2 : maxMultiple > 2.5 ? 1 : maxMultiple > 1 ? 0.5 : 0.25;
	const top = Math.ceil(maxMultiple / step) * step;
	const ticks: number[] = [];
	for (let m = 0; m <= top + 1e-9; m += step) ticks.push(m);
	return { top, ticks };
}

function svg<K extends keyof SVGElementTagNameMap>(
	tag: K,
	attrs: Record<string, string | number> = {},
) {
	const el = document.createElementNS(SVG_NS, tag);
	for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
	return el;
}

export function initReturnsChart(root: HTMLElement) {
	const chart = root.querySelector<SVGSVGElement>('[data-chart]');
	const slider = root.querySelector<HTMLInputElement>('[data-amount]');
	const amountOut = root.querySelector<HTMLOutputElement>('[data-amount-out]');
	const yearOut = root.querySelector<HTMLElement>('[data-year]');
	const captionOut = root.querySelector<HTMLElement>('[data-caption]');
	const replay = root.querySelector<HTMLButtonElement>('[data-replay]');
	if (!chart || !slider) return;

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const axis = computeAxis();

	const xFor = (year: number) => PAD.left + (year / CHART_YEARS) * PLOT_W;
	const yFor = (multiple: number) => PAD.top + PLOT_H - (multiple / axis.top) * PLOT_H;

	let principal = Number(slider.value);
	let year = 0; // current position on the timeline, 0..CHART_YEARS
	let raf = 0;
	let playing = false;

	// ── static scaffolding: gridlines, axis labels ──
	const grid = svg('g', { class: 'chart-grid' });
	const labels = svg('g', { class: 'chart-labels' });
	const yLabels: { el: SVGTextElement; multiple: number }[] = [];

	for (const multiple of axis.ticks) {
		const y = yFor(multiple);
		grid.append(
			svg('line', { x1: PAD.left, x2: VIEW_W - PAD.right, y1: y, y2: y, class: 'chart-gridline' }),
		);
		const label = svg('text', {
			x: PAD.left - 10,
			y: y + 4,
			'text-anchor': 'end',
			class: 'chart-label',
		});
		labels.append(label);
		yLabels.push({ el: label, multiple });
	}

	for (let y = 0; y <= CHART_YEARS; y += 2) {
		const label = svg('text', {
			x: xFor(y),
			y: VIEW_H - 10,
			'text-anchor': 'middle',
			class: 'chart-label',
		});
		label.textContent = y === 0 ? 'Start' : `Yr ${y}`;
		labels.append(label);
	}

	// ── series ──
	interface Series {
		scenario: ReturnScenario;
		path: SVGPathElement;
		dot: SVGCircleElement;
		emoji: SVGTextElement;
		value: HTMLElement | null;
		loss: HTMLElement | null;
	}

	const seriesLayer = svg('g');
	const series: Series[] = RETURN_SCENARIOS.map((scenario) => {
		const path = svg('path', {
			class: `chart-line chart-line--${scenario.id}${scenario.comparison ? ' is-comparison' : ''}`,
			fill: 'none',
		});
		const dot = svg('circle', { r: 4, class: `chart-dot chart-dot--${scenario.id}` });
		const emoji = svg('text', { class: 'chart-emoji', 'aria-hidden': 'true' });
		emoji.textContent = scenario.emoji;
		seriesLayer.append(path, dot, emoji);
		return {
			scenario,
			path,
			dot,
			emoji,
			value: root.querySelector<HTMLElement>(`[data-value="${scenario.id}"]`),
			loss: root.querySelector<HTMLElement>(`[data-loss="${scenario.id}"]`),
		};
	});

	const guide = svg('line', {
		y1: PAD.top,
		y2: PAD.top + PLOT_H,
		class: 'chart-guide',
	});

	chart.replaceChildren(grid, labels, guide, seriesLayer);

	function render() {
		// y-axis labels depend on the invested amount
		for (const { el, multiple } of yLabels) el.textContent = usd.format(multiple * principal);

		for (const { scenario, path, dot, emoji, value, loss } of series) {
			const steps = Math.max(1, Math.round(year * SAMPLES_PER_YEAR));
			let d = '';
			for (let i = 0; i <= steps; i++) {
				const t = (i / steps) * year;
				const x = xFor(t);
				const y = yFor(valueAt(1, scenario.annualRate, t));
				d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
			}
			path.setAttribute('d', d);

			const headX = xFor(year);
			const headY = yFor(valueAt(1, scenario.annualRate, year));
			dot.setAttribute('cx', headX.toFixed(1));
			dot.setAttribute('cy', headY.toFixed(1));

			// Emoji rides the head of the line, flipping sides near the right edge so it stays in view.
			const nearEdge = headX > VIEW_W - PAD.right - 30;
			emoji.setAttribute('x', (headX + (nearEdge ? -8 : 10)).toFixed(1));
			emoji.setAttribute('y', (headY + (nearEdge ? -9 : 6)).toFixed(1));
			emoji.setAttribute('text-anchor', nearEdge ? 'end' : 'start');

			const current = valueAt(principal, scenario.annualRate, year);
			if (value) value.textContent = usd.format(current);
			if (loss) {
				const lost = principal - current;
				loss.textContent =
					Math.abs(lost) < 0.5
						? 'Break-even so far'
						: lost > 0
							? `−${usd.format(lost)} lost`
							: `+${usd.format(-lost)} gained`;
			}
		}

		guide.setAttribute('x1', xFor(year).toFixed(1));
		guide.setAttribute('x2', xFor(year).toFixed(1));

		if (captionOut) {
			captionOut.textContent =
				year >= CHART_YEARS
					? FINAL_CAPTION
					: YEAR_CAPTIONS[Math.min(YEAR_CAPTIONS.length - 1, Math.floor(year))];
		}

		if (yearOut) {
			yearOut.textContent =
				year === 0 ? 'Start' : year >= CHART_YEARS ? `Year ${CHART_YEARS}` : `Year ${Math.floor(year) + 1}`;
		}
	}

	function stop() {
		cancelAnimationFrame(raf);
		playing = false;
		root.classList.remove('is-playing');
	}

	function play() {
		stop();
		if (reducedMotion.matches) {
			year = CHART_YEARS;
			render();
			return;
		}
		year = 0;
		playing = true;
		root.classList.add('is-playing');
		const startedAt = performance.now();

		const tick = (now: number) => {
			const progress = Math.min(1, (now - startedAt) / DURATION_MS);
			year = easeInOut(progress) * CHART_YEARS;
			render();
			if (progress < 1) raf = requestAnimationFrame(tick);
			else stop();
		};
		raf = requestAnimationFrame(tick);
	}

	// ── interactions ──
	slider.addEventListener('input', () => {
		principal = Number(slider.value);
		if (amountOut) amountOut.textContent = usd.format(principal);
		slider.style.setProperty(
			'--fill',
			`${((principal - Number(slider.min)) / (Number(slider.max) - Number(slider.min))) * 100}%`,
		);
		render();
	});
	slider.dispatchEvent(new Event('input'));

	replay?.addEventListener('click', play);

	// Scrub through time by hovering / dragging over a finished chart.
	const scrub = (event: PointerEvent) => {
		if (playing) return;
		const rect = chart.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * VIEW_W;
		const t = ((x - PAD.left) / PLOT_W) * CHART_YEARS;
		year = Math.min(CHART_YEARS, Math.max(0, t));
		render();
	};
	chart.addEventListener('pointermove', scrub);
	chart.addEventListener('pointerdown', scrub);
	chart.addEventListener('pointerleave', () => {
		if (playing) return;
		year = CHART_YEARS;
		render();
	});

	// Start the animation the first time the chart is meaningfully on screen.
	render();
	if ('IntersectionObserver' in window) {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					observer.disconnect();
					play();
				}
			},
			{ threshold: 0.45 },
		);
		observer.observe(chart);
	} else {
		play();
	}
}
