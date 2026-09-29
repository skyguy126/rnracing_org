export const PLACEHOLDER_BIO =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';

export const CREW_MEMBERS = [
	{ name: 'Jesus', title: 'Lord & Savior' },
	{ name: 'Nyle', title: 'Executive Chair' },
	{ name: 'Rohith', title: 'Dictator, Day Shift' },
	{ name: 'Vamsi', title: 'Dictator, Night Shift' },
	{ name: 'Vasu', title: 'Garage Supervisor, Section 8' },
	{ name: 'Kamran', title: 'Head of Human Resources' },
	{ name: 'Sid', title: 'Head Intern, Human Resources' },
	{ name: 'Varoon', title: 'General Counsel, Immigration Affairs' },
	{ name: 'Jaime', title: 'General Counsel, Diversity' },
	{ name: 'Danial', title: 'Director of Chirping' },
	{ name: 'Baggy', title: 'Director of Ragebait Strategy' },
	{ name: 'Jatin', title: 'Intern, Director of Intelligence' },
	{ name: 'Tobias', title: 'Faith-based Outreach' },
	{ name: 'Anmol', title: 'Intern, Group Leader' },
	{ name: 'Bavina', title: 'Intern, Pit Crew Manager' },
	{ name: 'Saharsh', title: 'Intern, Student Driver Program' },
	{ name: 'Ashish', title: 'Intern, Head of Transport & Logistics' },
] as const;

// Anyone not listed here (other than the top of the chart) reports to Nyle.
const REPORTS_TO_BY_NAME: Partial<Record<string, string>> = {
	Jesus: undefined,
	Tobias: 'Jesus',
	Nyle: 'Tobias',
	Sid: 'Kamran',
	Jatin: 'Sid',
	Anmol: 'Sid',
	Bavina: 'Sid',
	Saharsh: 'Sid',
	Ashish: 'Sid',
};
const DEFAULT_MANAGER = 'Nyle';

const PHOTO_BY_NAME: Partial<Record<string, string>> = {
	Vamsi: 'Vamsi.png',
	Rohith: 'Rohith.png',
	Kamran: 'Kamran.jpeg',
	Nyle: 'Nyle.png',
	Danial: 'Danial.jpeg',
	Varoon: 'Varoon.jpeg',
	Jaime: 'Jaime.jpeg',
	Vasu: 'Vasu.png',
	Sid: 'Sid.png',
	Baggy: 'Baggy.jpeg',
	Jatin: 'Jatin.png',
	Tobias: 'Toby.png',
	Jesus: 'Jesus.jpg',
	Bavina: 'Bavina.jpeg',
	Anmol: 'Anmol.png',
};

const LIGHT_PHOTO_BY_NAME: Partial<Record<string, string>> = {
	Vamsi: 'Vamsi.png',
	Nyle: 'Nyle.png',
	Vasu: 'Vasu.png',
	Sid: 'Sid.png',
	Jatin: 'Jatin.png',
	Tobias: 'Toby.png',
};

const PHOTO_STYLE_BY_NAME: Partial<Record<string, { fit?: 'cover' | 'contain'; position?: string }>> = {
	Vamsi: { fit: 'cover', position: 'center' },
	Rohith: { fit: 'cover', position: 'center' },
	Kamran: { fit: 'cover', position: 'center' },
	Nyle: { fit: 'cover', position: 'center' },
	Danial: { fit: 'cover', position: 'center' },
	Varoon: { fit: 'cover', position: 'center' },
	Jaime: { fit: 'cover', position: 'center' },
	Vasu: { fit: 'cover', position: 'center' },
	Sid: { fit: 'cover', position: 'center' },
	Baggy: { fit: 'cover', position: 'center' },
	Jesus: { fit: 'cover', position: 'center 20%' },
	Bavina: { fit: 'cover', position: 'center 30%' },
	Anmol: { fit: 'cover', position: 'center' },
};

const MODAL_CROP_BY_NAME: Record<string, { x: number; y: number; scale: number }> = {
	Vamsi: { x: 10, y: 10, scale: 0.2 },
	Rohith: { x: 50, y: 48, scale: 1.1 },
	Kamran: { x: 50, y: 42, scale: 1.1 },
	Nyle: { x: 52, y: 35, scale: 0.5 },
	Danial: { x: 50, y: 40, scale: 1.12 },
	Varoon: { x: 50, y: 40, scale: 1.1 },
	Jaime: { x: 50, y: 50, scale: 1 },
	Vasu: { x: 50, y: 40, scale: 1.1 },
	Sid: { x: 50, y: 45, scale: 1.1 },
	Baggy: { x: 50, y: 45, scale: 1.1 },
	Jesus: { x: 50, y: 30, scale: 1 },
	Bavina: { x: 50, y: 35, scale: 1 },
	Anmol: { x: 50, y: 35, scale: 1 },
};

const BIO_BY_NAME: Partial<Record<string, string>> = {
	Vamsi: 'Vamsi started RN Racing with one noble goal - to mog everyone else on the racetrack, one lap at a time.',
	Rohith: 'Rohith has poured his heart and soul into building RN Racing into the cultural juggernaut that it is today because he knows what this all truly is - the world’s most epic dad lore.',
	Kamran: 'Kamran doesn’t just build cars - he builds teams and culture. He is dedicated to creating a safe environment where everyone feels included and respected (by negging them when necessary).',
	Nyle: 'Nyle was brought in to think big picture, using seasoned executive strategy (aka pure vibes, poor decision-making, and a lot of LARPing) to keep RN Racing driving triumphantly towards the sunset - and beyond.',
	Danial: 'Danial believes that creating true change comes from having conversations - even when they’re about total nonsense. He is a true engineer when it comes to yapping and if there is ever a silent moment, he will not hesitate to open his mouth and start talking.',
	Varoon: 'RN Racing believes that borders should not be barriers and Varoon leverages his own experience to make sure that the team remain globally-minded and inclusive, no matter where a team member was born',
	Vasu: 'Every car needs a home and every garage needs a guardian. Vasu ensures that the garage runs smoothly and is a place where serious business (absolute chaos) can always be conducted.',
	Sid: 'Human resources is so important to us, we brought Sid in as a specialist to ensure the team remains well-supported and compliant (we all love each other, we swear).',
	Baggy: 'Baggy keeps the team fired up, using carefully orchestrated ragebait to push the team to perform at their best, usually out of spite and frustration with him.',
	Jaime: 'Jaime is a true champion of diversity and inclusion, ensuring that the team remains welcoming and supportive to all, no matter their background or identity.',
	Jatin: 'In a complex geopolitical environment filled with many race cars, Jatin employs his signature smoke and mirrors to infiltrate the competitive landscape and gather crucial intelligence to ensure a RN victory',
	Anmol: 'Anmol is the unanimously elected leader of the interns (mainly because everyone else is too lazy to want to organize anything). Using her years of experience of being a type-A personality since birth, she rules with an iron fist and will do anything to get that return offer.',
	Ashish: "As a former collegiate dance captain, Ashish puts the “art” in “car parts”. He’s using his entire creative skillset in the most artistically expressive project an intern can have - coordinating transportation logistics to get the rest of the interns onsite.",
	Saharsh: "Saharsh brings years of extensive driving experience to RN Racing - specifically, years of sitting in the driver's seat while Tesla Autopilot takes him anywhere he wants to go. Having mastered the art of keeping his hands somewhere near the wheel, he is ready to become the track beast we always knew he could be.",
	Bavina: 'She may not be as fast as Guido, but you take what you can get. Luckily for Bavina, the bar is low - the rest of the pit crew is still looking for the lug nuts.',
	Jesus: 'Jesus sits atop the RN Racing org chart, where He has final say on all matters. He is always available to take the wheel.',
	Tobias: "No matter how fast our car is, the one thing you can't outrace is God. Tobias is our in-house pastor, leading us in prayer and assuring us that no matter what happens on the track, we can always rely on Jesus to take the wheel.",
};

export type CrewMember = (typeof CREW_MEMBERS)[number] & {
	bio: string;
	reportsTo?: string;
	image?: string;
	lightImage?: string;
	imageFit?: 'cover' | 'contain';
	imagePosition?: string;
	modalCrop?: {
		x: number;
		y: number;
		scale: number;
	};
};

export const crewMembers: CrewMember[] = CREW_MEMBERS.map((member) => ({
	...member,
	bio: BIO_BY_NAME[member.name] ?? PLACEHOLDER_BIO,
	reportsTo: member.name in REPORTS_TO_BY_NAME ? REPORTS_TO_BY_NAME[member.name] : DEFAULT_MANAGER,
	image: PHOTO_BY_NAME[member.name],
	lightImage: LIGHT_PHOTO_BY_NAME[member.name] ?? PHOTO_BY_NAME[member.name],
	imageFit: PHOTO_STYLE_BY_NAME[member.name]?.fit ?? 'cover',
	imagePosition: PHOTO_STYLE_BY_NAME[member.name]?.position ?? 'center',
	modalCrop: MODAL_CROP_BY_NAME[member.name] ?? { x: 50, y: 50, scale: 1 },
}));

export type CrewNode = {
	member: CrewMember;
	index: number;
	reports: CrewNode[];
};

/** Builds the reporting tree; returns the members at the top of the chart. */
export function getCrewTree(members: CrewMember[]): CrewNode[] {
	const nodes = members.map((member, index): CrewNode => ({ member, index, reports: [] }));
	const roots: CrewNode[] = [];
	nodes.forEach((node) => {
		const manager = nodes.find((n) => n.member.name === node.member.reportsTo);
		(manager ? manager.reports : roots).push(node);
	});
	return roots;
}

/** Size of the largest group of people sharing a manager; sets how many cards fit across. */
export function getWidestGroup(nodes: CrewNode[]): number {
	return Math.max(nodes.length, ...nodes.map((node) => getWidestGroup(node.reports)));
}

/** Number of levels in the reporting tree. */
export function getTreeDepth(nodes: CrewNode[]): number {
	return nodes.length ? 1 + Math.max(...nodes.map((node) => getTreeDepth(node.reports))) : 0;
}

export function getInitials(name: string) {
	return name.slice(0, 2).toUpperCase();
}
