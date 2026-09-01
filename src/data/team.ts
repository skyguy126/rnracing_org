export const PLACEHOLDER_BIO =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';

export const TEAM_MEMBERS = [
	{ name: 'Vamsi', title: 'Co-Founder' },
	{ name: 'Rohith', title: 'Co-Founder' },
	{ name: 'Kamran', title: 'Human Resources' },
	{ name: 'Nyle', title: 'CEO and Team Captain' },
	{ name: 'Danial', title: 'Lead Chirp Engineer' },
	{ name: 'Varoon', title: 'Immigration Lawyer' },
	{ name: 'Vasu', title: 'Section 8 Garage Supervisor' },
	{ name: 'Sid', title: "Kamran's Intern" },
	{ name: 'Baggy', title: 'Lead Ragebaiter' },
] as const;

export type TeamMember = (typeof TEAM_MEMBERS)[number] & { bio: string };

export const teamMembers: TeamMember[] = TEAM_MEMBERS.map((member) => ({
	...member,
	bio: PLACEHOLDER_BIO,
}));

export function getInitials(name: string) {
	return name.slice(0, 2).toUpperCase();
}
