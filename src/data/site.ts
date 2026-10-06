export const SITE = {
	name: 'RN Racing',
	description: 'RN Racing — motorsport team. More coming soon.',
	email: 'team@rnracing.org',
	instagram: 'https://www.instagram.com/_rnracing_/',
	youtube: 'https://www.youtube.com/@rnracingorg',
	twitter: 'https://x.com/24HoursOfLemons',
	github: 'https://github.com/skyguy126/rnracing',
} as const;

/** Content pages — single source of truth for nav labels, routes, and headings. */
export const PAGES = [
	{ href: '/', slug: 'home', label: 'Home', heading: 'RN Racing' },
	{ href: '/the-car', slug: 'the-car', label: 'The Car', heading: 'The Car' },
	{ href: '/crew', slug: 'crew', label: 'The Crew', heading: 'The Crew' },
	{ href: '/gallery', slug: 'gallery', label: 'Gallery', heading: 'Gallery' },
	{ href: '/timeline', slug: 'timeline', label: 'The Timeline', heading: 'The Timeline' },
	{ href: '/values', slug: 'values', label: 'Our Values', heading: 'Our Values' },
	{
		href: '/investors-faq',
		slug: 'investors-faq',
		label: 'Investors',
		heading: 'Investors',
	},
	{ href: '/who-we-are', slug: 'who-we-are', label: 'Who We Are', heading: 'Who We Are' },
	{ href: '/community', slug: 'community', label: 'The Community', heading: 'The Community' },
	{ href: '/store', slug: 'store', label: 'Store', heading: 'The Store' },
] as const;

export type PageHref = (typeof PAGES)[number]['href'];

export const NAV_LINKS = [
	{ href: '/', label: 'Home' },
	{ href: '/who-we-are', label: 'Who We Are' },
	{ href: '/the-car', label: 'The Car' },
	{ href: '/crew', label: 'The Crew' },
	{ href: '/community', label: 'The Community' },
	{ href: '/timeline', label: 'The Timeline' },
	{ href: '/design', label: 'The Dojo' },
	{ href: '/values', label: 'Our Values' },
	{ href: '/investors-faq', label: 'For Investors' },
	{ href: '/store', label: 'Store' },
	{ href: '/gallery', label: 'Gallery' },
] as const;

export function getPage(href: PageHref) {
	const page = PAGES.find((entry) => entry.href === href);
	if (!page) throw new Error(`Unknown page: ${href}`);
	return page;
}

export function pageTitle(heading: string) {
	return heading === SITE.name ? SITE.name : `${heading} — ${SITE.name}`;
}
