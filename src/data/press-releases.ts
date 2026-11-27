export const pressReleases = [
	{
		slug: 'board-removes-new-ceo',
		title: 'Board Removes New CEO After Falling for Honeypot',
		published: '2026-11-22T12:00',
		summary: 'RN Racing’s board removed its newly appointed CEO after the executive fell for a honeypot.',
		intro: "RN Racing's board decided to remove Sid from his position after the newly appointed CEO immediately fell for a woman who turned out to be a spy from a rival racing team.",
		body: [
			"The decision came at noon, two hours after the board announced the appointment. Sid's first morning on the job was also his last.",
		],
	},
	{
		slug: 'board-appoints-new-ceo',
		title: 'Board Appoints New CEO',
		published: '2026-11-22T10:00',
		summary: 'RN Racing’s board announced the appointment of a new chief executive officer.',
		intro: 'In a stunning move by the new board brought in by Notable Capital, CEO Nyle Arora has been exited and replaced by former HR intern, Sid.',
		body: [
			"It's a meteoric rise for the new CEO, who is now the boss of everyone who once made him get their coffee. Sid has promised to lead RN Racing into a bold new future by cutting revenue and increasing costs",
		],
	},
	{
		slug: 'notable-capital-series-a',
		title: 'RN Racing Gets Series A Funding from Notable Capital',
		published: '2026-11-21T10:07',
		summary: 'RN Racing announced Series A funding from Notable Capital as the team heads into Season 3.',
		intro: 'RN Racing announced Series A funding from Notable Capital as the team heads into Season 3. By that, we mean one of our team members recently got a job at Notable Capital and once paid us $328 in season 1 dues, which we are now counting as official VC funding.',
		body: [
			'With this funding round of $328, our official company valuation is now ...*checks notes*... $328, giving Notable Capital 100% ownership over RN Racing. Wait, shit.',
		],
	},
	{
		slug: 'halloween-meets-gasoline-buttonwillow-2026',
		title: 'RN Racing wins Halloween Meets Gasoline Award at Buttonwillow 2026',
		published: '2026-09-27T17:33',
		summary: 'RN Racing took home the Halloween Meets Gasoline Award at Buttonwillow in 2026.',
		body: [
			'The team brought a Fruit Ninja theme to race weekend, complete with ninja outfits and a fruit stand. The stand raised nearly $4,000 for Rosie’s Heroes, an animal rescue that provides care for street dogs.',
		],
	},
];

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });
const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
	dateStyle: 'long',
	timeStyle: 'short',
	timeZone: 'UTC',
});

export function formatReleaseDate(published: string) {
	// Treat editorial dates and times as written, without shifting them by the build host's timezone.
	return published.includes('T')
		? dateTimeFormat.format(new Date(`${published}Z`))
		: dateFormat.format(new Date(published));
}
