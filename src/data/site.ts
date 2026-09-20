export const SITE = {
	name: 'RN Racing',
	description: 'RN Racing — motorsport team. More coming soon.',
	email: 'hello@rnracing.org',
	instagram: 'https://www.instagram.com/_rnracing_/',
	twitter: 'https://x.com/24HoursOfLemons',
	github: 'https://github.com/skyguy126/rnracing',
} as const;

/** Content pages — single source of truth for nav labels, routes, and headings. */
export const PAGES = [
	{ href: '/', slug: 'home', label: 'Home', heading: 'RN Racing' },
	{ href: '/who-we-are', slug: 'who-we-are', label: 'Who We Are', heading: 'Who We Are' },
	{ href: '/crew', slug: 'crew', label: 'The Crew', heading: 'The Crew' },
	{ href: '/timeline', slug: 'timeline', label: 'The Timeline', heading: 'The Timeline' },
] as const;

export type PageHref = (typeof PAGES)[number]['href'];

export const NAV_LINKS = [
	...PAGES.map(({ href, label }) => ({ href, label })),
	{ href: '/reveal', label: 'The Design' },
] as const;

export function getPage(href: PageHref) {
	const page = PAGES.find((entry) => entry.href === href);
	if (!page) throw new Error(`Unknown page: ${href}`);
	return page;
}

export function pageTitle(heading: string) {
	return heading === SITE.name ? SITE.name : `${heading} — ${SITE.name}`;
}
