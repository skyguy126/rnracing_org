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
	{ href: '/crew', slug: 'crew', label: 'The Crew', heading: 'The Crew' },
	{ href: '/timeline', slug: 'timeline', label: 'The Timeline', heading: 'The Timeline' },
	{
		href: '/investors-faq',
		slug: 'investors-faq',
		label: 'Investors',
		heading: 'Investors',
	},
	{ href: '/who-we-are', slug: 'who-we-are', label: 'Who We Are', heading: 'Who We Are' },
] as const;

export type PageHref = (typeof PAGES)[number]['href'];

export const NAV_LINKS = [
	{ href: '/', label: 'Home' },
	{ href: '/crew', label: 'The Crew' },
	{ href: '/timeline', label: 'The Timeline' },
	{ href: '/reveal', label: 'The Design' },
	{ href: '/who-we-are', label: 'Who We Are' },
	{ href: '/investors-faq', label: 'Investors' },
] as const;

export function getPage(href: PageHref) {
	const page = PAGES.find((entry) => entry.href === href);
	if (!page) throw new Error(`Unknown page: ${href}`);
	return page;
}

export function pageTitle(heading: string) {
	return heading === SITE.name ? SITE.name : `${heading} — ${SITE.name}`;
}
