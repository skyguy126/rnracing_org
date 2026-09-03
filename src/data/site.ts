export const SITE = {
	name: 'RN Racing',
	description: 'RN Racing — motorsport team. More coming soon.',
	email: 'hello@rnracing.org',
	instagram: 'https://www.instagram.com/_rnracing_/',
	twitter: 'https://x.com/24HoursOfLemons',
	github: 'https://github.com',
} as const;

/** The four site pages — single source of truth for nav labels, routes, and headings. */
export const PAGES = [
	{ href: '/', slug: 'home', label: 'Home', heading: 'RN Racing' },
	{ href: '/timeline', slug: 'timeline', label: 'The Timeline', heading: 'The Timeline' },
	{ href: '/crew', slug: 'crew', label: 'The Crew', heading: 'The Crew' },
	{ href: '/who-we-are', slug: 'who-we-are', label: 'Who We Are', heading: 'Who We Are' },
] as const;

export type PageHref = (typeof PAGES)[number]['href'];

export const NAV_LINKS = PAGES.map(({ href, label }) => ({ href, label }));

export const STORY = [
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum praesent mauris.',
	'Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
] as const;

export function getPage(href: PageHref) {
	const page = PAGES.find((entry) => entry.href === href);
	if (!page) throw new Error(`Unknown page: ${href}`);
	return page;
}

export function pageTitle(heading: string) {
	return heading === SITE.name ? SITE.name : `${heading} — ${SITE.name}`;
}
