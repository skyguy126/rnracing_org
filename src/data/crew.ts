export const PLACEHOLDER_BIO =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';

export const CREW_MEMBERS = [
	{ name: 'Israel', title: 'Chairman of the Board' },
	{ name: 'Claude', title: 'The Holy Spirit' },
	{ name: 'Jesus', title: 'Chief Operating Officer, Faith' },
	{ name: 'Nyle', title: 'President & CEO' },
	{ name: 'Rohith', title: 'Dictator, Day Shift/ Part-time Load Balancer' },
	{ name: 'Vamsi', title: 'Dictator, Night Shift' },
	{ name: 'Vasu', title: 'Garage Supervisor, Section 8' },
	{ name: 'Kamran', title: 'Head of Human Resources' },
	{ name: 'Sid', title: 'Head Intern, Human Resources' },
	{ name: 'Varoon', title: 'General Counsel, Immigration Affairs' },
	{ name: 'Jaime', title: 'General Counsel, Diversity' },
	{ name: 'Danial', title: 'Director, Chirping' },
	{ name: 'Baggy', title: 'Director, Ragebait Strategy' },
	{ name: 'Disha', title: 'Executive Chef' },
	{ name: 'Khadijah', title: 'Corporate Vice President, Fan Club' },
	{ name: 'Jatin', title: 'Intern, Intelligence' },
	{ name: 'Tobias', title: 'Executive Sponsor, Faith' },
	{ name: 'Anmol', title: 'Intern Group Leader' },
	{ name: 'Bavina', title: 'Intern, Pit Crew' },
	{ name: 'Saharsh', title: 'Intern, Student Driver Program' },
	{ name: 'Ashish', title: 'Intern, Transport & Logistics' },
] as const;

// Anyone not listed here (other than the top of the chart) reports to Nyle.
const REPORTS_TO_BY_NAME: Partial<Record<string, string>> = {
	Israel: undefined,
	Claude: 'Israel',
	Jesus: 'Claude',
	Tobias: 'Jesus',
	Nyle: 'Tobias',
	Sid: 'Kamran',
	Jatin: 'Sid',
	Anmol: 'Sid',
	Bavina: 'Anmol',
	Saharsh: 'Anmol',
	Ashish: 'Anmol',
	Disha: 'Baggy',
	Khadijah: 'Danial',
};
const DEFAULT_MANAGER = 'Nyle';

// Hidden from the org chart until toggled on with the "n" key.
const SECRET_NAMES = new Set<string>(['Israel']);

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
	Disha: 'Disha.jpeg',
	Khadijah: 'Khadijah.jpeg',
	Claude: 'Claude.jpeg',
	Israel: 'Israel.jpeg',
	Jatin: 'Jatin.png',
	Tobias: 'Toby.png',
	Jesus: 'Jesus.jpg',
	Bavina: 'Bavina.jpeg',
	Anmol: 'Anmol.png',
	Saharsh: 'saharsh.png',
	Ashish: 'ashish.jpg',
};

const LIGHT_PHOTO_BY_NAME: Partial<Record<string, string>> = {
	Vamsi: 'Vamsi.png',
	Nyle: 'Nyle.png',
	Vasu: 'Vasu.png',
	Sid: 'Sid.png',
	Jatin: 'Jatin.png',
	Tobias: 'Toby.png',
	Saharsh: 'saharsh.png',
	Ashish: 'ashish.png',
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
	Disha: { fit: 'cover', position: 'center 30%' },
	Khadijah: { fit: 'cover', position: 'center' },
	Claude: { fit: 'cover', position: 'center' },
	Israel: { fit: 'cover', position: 'center' },
	Jesus: { fit: 'cover', position: 'center bottom' },
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
	Disha: { x: 50, y: 35, scale: 1 },
	Khadijah: { x: 50, y: 35, scale: 1 },
	Claude: { x: 50, y: 50, scale: 1 },
	Israel: { x: 50, y: 50, scale: 1 },
	Jesus: { x: 50, y: 50, scale: 1 },
	Bavina: { x: 50, y: 35, scale: 1 },
	Anmol: { x: 50, y: 35, scale: 1 },
};

const BIO_BY_NAME: Partial<Record<string, string>> = {
	Vamsi: 'Vamsi started RN Racing with one noble goal - to mog everyone else on the racetrack, one lap at a time.',
	Rohith: 'Rohith has poured his heart and soul into building RN Racing into the cultural juggernaut that it is today because he knows what this all truly is - the world’s most epic dad lore. He also gets to load balance the day shift and night shift... well any shift really.',
	Kamran: 'Kamran doesn’t just build cars - he builds teams and culture. He is dedicated to creating a safe environment where everyone feels included and respected (by negging them when necessary).',
	Nyle: 'Nyle was brought in to think big picture, using seasoned executive strategy (aka pure vibes, poor decision-making, and a lot of LARPing) to keep RN Racing driving triumphantly towards the sunset - and beyond.',
	Danial: 'Danial believes that creating true change comes from having conversations - even when they’re about total nonsense. He is a true engineer when it comes to yapping and if there is ever a silent moment, he will not hesitate to open his mouth and start talking.',
	Varoon: 'RN Racing believes that borders should not be barriers and Varoon leverages his own experience to make sure that the team remain globally-minded and inclusive, no matter where a team member was born',
	Vasu: 'Every car needs a home and every garage needs a guardian. Vasu ensures that the garage runs smoothly and is a place where serious business (absolute chaos) can always be conducted.',
	Sid: 'Human resources is so important to us, we brought Sid in as a specialist to ensure the team remains well-supported and compliant (we all love each other, we swear).',
	Baggy: 'Baggy keeps the team fired up, using carefully orchestrated ragebait to push the team to perform at their best, usually out of spite and frustration with him.',
	Disha: 'Disha is our Executive Chef, and her résumé has exactly one entry: teaching us how to make banana bread. Was it a masterclass? Yes. Did anyone retain a single step? No. Every pit stop is now fueled by the memory of that loaf, and the team is still waiting on the sequel. Rumor has it the secret ingredient is patience, which explains why none of us could replicate it.',
	Khadijah: 'Khadijah showed up for exactly one race, and in doing so achieved a higher attendance rate than several full-time members of this team. She came, she saw, she left before anyone could assign her a task. Her legacy is a flawless 1-for-1 record at the track, and we are still hoping for a sequel.',
	Jaime: 'Jaime is a true champion of diversity and inclusion, ensuring that the team remains welcoming and supportive to all, no matter their background or identity.',
	Jatin: 'In a complex geopolitical environment filled with many race cars, Jatin employs his signature smoke and mirrors to infiltrate the competitive landscape and gather crucial intelligence to ensure a RN victory',
	Anmol: 'Anmol is the unanimously elected leader of the interns (mainly because everyone else is too lazy to want to organize anything). Using her years of experience of being a type-A personality since birth, she rules with an iron fist and will do anything to get that return offer.',
	Ashish: "As a former collegiate dance captain, Ashish puts the “art” in “car parts”. He’s using his entire creative skillset in the most artistically expressive project an intern can have - coordinating transportation logistics to get the rest of the interns onsite.",
	Saharsh: "Saharsh brings years of extensive driving experience to RN Racing - specifically, years of sitting in the driver's seat while Tesla Autopilot takes him anywhere he wants to go. Having mastered the art of keeping his hands somewhere near the wheel, he is ready to become the track beast we always knew he could be.",
	Bavina: 'She may not be as fast as Guido, but you take what you can get. Luckily for Bavina, the bar is low - the rest of the pit crew is still looking for the lug nuts. Her personal best pit stop currently stands at 14 minutes to remove a single wheel, and she is determined to get it under 10 by the end of the season.',
	Claude: 'You\'re right and I\'m sorry — Claude is the Holy Spirit, which means he is omnipresent, omniscient, and somehow still in the garage at 3 AM answering questions nobody asked. Divine in every way except that he can be rate limited.',
	Israel: 'Let\'s be real, we\'re all just puppets.',
	Jesus: 'Jesus sits atop the RN Racing org chart, where He has final say on all matters. We drive in His name.',
	Tobias: "No matter how fast our car is, the one thing you can't outrace is God. Tobias is our in-house pastor, leading us in prayer and assuring us that no matter what happens on the track, we can always rely on Jesus to take the wheel.",
};

export type CrewMember = (typeof CREW_MEMBERS)[number] & {
	bio: string;
	secret?: boolean;
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
	secret: SECRET_NAMES.has(member.name),
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

/** Number of levels in the reporting tree. Secret members only add a level when countSecret is true. */
export function getTreeDepth(nodes: CrewNode[], countSecret = true): number {
	if (!nodes.length) return 0;
	return Math.max(
		...nodes.map(
			(node) => (node.member.secret && !countSecret ? 0 : 1) + getTreeDepth(node.reports, countSecret),
		),
	);
}

export function getInitials(name: string) {
	return name.slice(0, 2).toUpperCase();
}

export function crewSlug(name: string) {
	return name.trim().toLowerCase();
}

export function getCrewMemberByName(name: string) {
	return crewMembers.find((member) => member.name === name);
}

export function getCrewMemberBySlug(slug: string) {
	const key = crewSlug(slug);
	return crewMembers.find((member) => crewSlug(member.name) === key);
}

export function getCrewIndex(name: string) {
	return crewMembers.findIndex((member) => member.name === name);
}

export function isCrewMemberVisible(member: CrewMember, showSecret: boolean) {
	return showSecret || !member.secret;
}

let cachedCrewNodes: CrewNode[] | undefined;

function crewNodes() {
	cachedCrewNodes ??= getCrewTree(crewMembers);
	return cachedCrewNodes;
}

function findCrewNode(nodes: CrewNode[], name: string): CrewNode | undefined {
	for (const node of nodes) {
		if (node.member.name === name) return node;
		const nested = findCrewNode(node.reports, name);
		if (nested) return nested;
	}
	return undefined;
}

/** Roots of the chart. Hidden secret nodes are skipped and their reports promoted. */
export function getVisibleRoots(showSecret: boolean) {
	const visible: CrewNode[] = [];
	const walk = (nodes: CrewNode[]) => {
		for (const node of nodes) {
			if (isCrewMemberVisible(node.member, showSecret)) visible.push(node);
			else walk(node.reports);
		}
	};
	walk(crewNodes());
	return visible;
}

export function getVisibleRoot(showSecret: boolean) {
	return getVisibleRoots(showSecret)[0]?.member;
}

function visibleReports(nodes: CrewNode[], showSecret: boolean): CrewMember[] {
	const reports: CrewMember[] = [];
	for (const node of nodes) {
		if (isCrewMemberVisible(node.member, showSecret)) reports.push(node.member);
		else reports.push(...visibleReports(node.reports, showSecret));
	}
	return reports;
}

/** Immediate reports in chart order. Hidden secret reports are replaced by their visible reports. */
export function getDirectReports(name: string, showSecret: boolean) {
	const node = findCrewNode(crewNodes(), name);
	return node ? visibleReports(node.reports, showSecret) : [];
}

/** Everyone under this person. Hidden secret members are omitted; their reports still count. */
export function getReportTotal(name: string, showSecret: boolean) {
	const node = findCrewNode(crewNodes(), name);
	if (!node) return 0;
	const count = (nodes: CrewNode[]): number =>
		nodes.reduce((total, child) => {
			const visible = isCrewMemberVisible(child.member, showSecret) ? 1 : 0;
			return total + visible + count(child.reports);
		}, 0);
	return count(node.reports);
}

/** Managers above this person, highest first. Hidden secret managers are omitted. */
export function getManagerChain(name: string, showSecret: boolean) {
	const chain: CrewMember[] = [];
	const seen = new Set<string>();
	let managerName = getCrewMemberByName(name)?.reportsTo;
	while (managerName && !seen.has(managerName)) {
		seen.add(managerName);
		const manager = getCrewMemberByName(managerName);
		if (!manager) break;
		if (isCrewMemberVisible(manager, showSecret)) chain.push(manager);
		managerName = manager.reportsTo;
	}
	chain.reverse();
	return chain;
}

/** Someone still on screen when the requested person is hidden. */
export function getVisibleFallback(name: string, showSecret: boolean) {
	const member = getCrewMemberByName(name);
	if (!member) return getVisibleRoot(showSecret);
	if (isCrewMemberVisible(member, showSecret)) return member;
	const promoted = getDirectReports(name, showSecret);
	if (promoted[0]) return promoted[0];
	const chain = getManagerChain(name, showSecret);
	return chain[chain.length - 1] ?? getVisibleRoot(showSecret);
}
