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

const PHOTO_BY_NAME: Partial<Record<string, string>> = {
	Vamsi: 'Vamsi.jpeg',
	Rohith: 'Rohith.png',
	Kamran: 'Kamran.jpeg',
	Nyle: 'Nyle.jpeg',
	Danial: 'Danial.jpeg',
	Varoon: 'Varoon.jpeg',
	Vasu: 'Vasu.jpg',
	Sid: 'Sid.jpeg',
	Baggy: 'Baggy.jpeg',
};

const PHOTO_STYLE_BY_NAME: Partial<Record<string, { fit?: 'cover' | 'contain'; position?: string }>> = {
	Vamsi: { fit: 'cover', position: 'center 50%' },
	Rohith: { fit: 'cover', position: 'center 18%' },
	Kamran: { fit: 'cover', position: 'center 18%' },
	Nyle: { fit: 'cover', position: 'center 10%' },
	Danial: { fit: 'cover', position: 'center 18%' },
	Varoon: { fit: 'cover', position: 'center 18%' },
	Vasu: { fit: 'cover', position: 'center 18%' },
	Sid: { fit: 'cover', position: 'center 18%' },
	Baggy: { fit: 'cover', position: 'center 18%' },
};

const MODAL_CROP_BY_NAME: Record<string, { x: number; y: number; scale: number }> = {
	Vamsi: { x: 10, y: 10, scale: 0.2 },
	Rohith: { x: 50, y: 48, scale: 1.1 },
	Kamran: { x: 50, y: 42, scale: 1.1 },
	Nyle: { x: 52, y: 35, scale: 0.5 },
	Danial: { x: 50, y: 40, scale: 1.12 },
	Varoon: { x: 50, y: 40, scale: 1.1 },
	Vasu: { x: 50, y: 40, scale: 1.1 },
	Sid: { x: 50, y: 45, scale: 1.1 },
	Baggy: { x: 50, y: 45, scale: 1.1 },
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
};

export type CrewMember = (typeof CREW_MEMBERS)[number] & {
	bio: string;
	image?: string;
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
	image: PHOTO_BY_NAME[member.name],
	imageFit: PHOTO_STYLE_BY_NAME[member.name]?.fit ?? 'cover',
	imagePosition: PHOTO_STYLE_BY_NAME[member.name]?.position ?? 'center 18%',
	modalCrop: MODAL_CROP_BY_NAME[member.name] ?? { x: 50, y: 50, scale: 1 },
}));

export function getInitials(name: string) {
	return name.slice(0, 2).toUpperCase();
}
