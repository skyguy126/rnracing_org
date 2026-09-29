/**
 * Illustrative (fictional, joking) return scenarios for the investors FAQ chart.
 * `annualRate` is a compound yearly rate: -0.3 = -30% per year.
 * The car scenarios all lose money and only differ in how badly; the
 * `comparison` scenarios are made-up alternatives that do better.
 * None of these are forecasts, promises, recommendations, or real financial products.
 */
export interface ReturnScenario {
	id: 'optimal' | 'decent' | 'bad' | 'horrible' | 'beanie' | 'tijuana';
	grade: string;
	label: string;
	blurb: string;
	emoji: string;
	annualRate: number;
	/** Non-car alternative, drawn dashed. */
	comparison?: boolean;
}

export const RETURN_SCENARIOS: readonly ReturnScenario[] = [
	{
		id: 'optimal',
		grade: 'Optimal',
		label: 'Class win',
		blurb:
			'Perfect pit stops, zero incidents, a podium. The trophy is a hubcap and the prize money covers one set of tires.',
		emoji: '🏆',
		annualRate: -0.06,
	},
	{
		id: 'decent',
		grade: 'Realistic',
		label: 'Finish upright',
		blurb:
			'Mid-pack and no fires. Still burned a season of tires, entry fees, and roughly nine miles of zip ties.',
		emoji: '🏁',
		annualRate: -0.16,
	},
	{
		id: 'bad',
		grade: 'Bad',
		label: 'Black flag on lap 12',
		blurb:
			'We met a tire wall at speed. Insurance is a word we have heard other teams use.',
		emoji: '💥',
		annualRate: -0.3,
	},
	{
		id: 'horrible',
		grade: 'Horrible',
		label: 'Engine fire',
		blurb:
			'A very expensive campfire, but with California energy prices, free heat and light is basically a dividend.',
		emoji: '🔥',
		annualRate: -0.03,
	},
	{
		id: 'beanie',
		grade: 'Comparison',
		label: 'Beanie Babies',
		blurb:
			'Mint condition, tag attached, never touched by human hands. Sits in a drawer and mostly refuses to lose money.',
		emoji: '🧸',
		annualRate: 0.01,
		comparison: true,
	},
	{
		id: 'tijuana',
		grade: 'Comparison',
		label: 'Tijuana property',
		blurb:
			'A lot with an ocean-ish view and a taco stand within walking distance. Zero engines to catch fire.',
		emoji: '🏡',
		annualRate: 0.08,
		comparison: true,
	},
] as const;

/** Captions for the chart ticker, indexed by completed years (0 = start). */
export const YEAR_CAPTIONS = [
	'Everyone is optimistic. The car is shiny.',
	'Someone said "it\'s just a small oil leak."',
	'The zip-tie budget now exceeds the engine budget.',
	'A brake pad is officially a subscription service.',
	'The tow truck driver knows us by name.',
	'Halfway. The spare tire has a spare tire.',
	'Same bolt replaced four times. Never the same bolt.',
	'Camry: "I\'m fine." Camry: *smoke*',
	'Nobody has mentioned the budget in months. Not a good sign.',
	'The car still runs. Nobody knows why.',
] as const;

export const FINAL_CAPTION = 'Congratulations. You now own a story instead of money.';

export const CHART_YEARS = 10;
export const DEFAULT_INVESTMENT = 1000;
export const MIN_INVESTMENT = 100;
export const MAX_INVESTMENT = 10000;
export const INVESTMENT_STEP = 100;

export function valueAt(principal: number, annualRate: number, years: number) {
	return principal * Math.pow(1 + annualRate, years);
}
