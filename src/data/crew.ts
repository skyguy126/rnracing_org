export const PLACEHOLDER_BIO =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';

export const CREW_MEMBERS = [
	{ name: 'Vamsi', title: 'Co-Founder' },
	{ name: 'Rohith', title: 'Co-Founder' },
	{ name: 'Kamran', title: 'Head of Human Resources' },
	{ name: 'Nyle', title: 'CEO & Team Captain' },
	{ name: 'Danial', title: 'Lead Chirp Systems Engineer' },
	{ name: 'Varoon', title: 'General Counsel, Immigration Affairs' },
	{ name: 'Vasu', title: 'Garage Supervisor — Section 8' },
	{ name: 'Sid', title: 'HR Intern (Reports to Kamran)' },
	{ name: 'Baggy', title: 'Director of Ragebait Strategy' },
] as const;

export type CrewMember = (typeof CREW_MEMBERS)[number] & { bio: string };

export const crewMembers: CrewMember[] = CREW_MEMBERS.map((member) => ({
	...member,
	bio: PLACEHOLDER_BIO,
}));

export function getInitials(name: string) {
	return name.slice(0, 2).toUpperCase();
}
