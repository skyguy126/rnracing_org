export const SITE = {
	name: 'RN Racing',
	description: 'RN Racing — motorsport team. More coming soon.',
	email: 'hello@rnracing.org',
	instagram: 'https://www.instagram.com/_rnracing_/',
} as const;

export const NAV_LINKS = [
	{ href: '/', label: 'Home' },
	{ href: '/team', label: 'The Crew' },
	{ href: '/about', label: 'Who We Are' },
] as const;

export const STORY = [
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum praesent mauris.',
	'Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
] as const;
