const LEMON_SRC = '/reveal/lemons/lemons_logo_whole.png';
const SPAWN_MS = 70;
const MAX_ACTIVE = 14;

function canHoverRain() {
	return (
		window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
		!window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

export function initLemonRain(link: HTMLElement) {
	const rain = link.querySelector<HTMLElement>('.lemon-rain');
	if (!rain) return;

	let spawnTimer: ReturnType<typeof setInterval> | null = null;
	let active = 0;

	const stop = () => {
		if (spawnTimer !== null) {
			clearInterval(spawnTimer);
			spawnTimer = null;
		}
	};

	const spawn = () => {
		if (active >= MAX_ACTIVE) return;

		const drop = document.createElement('img');
		drop.className = 'lemon-drop';
		drop.src = LEMON_SRC;
		drop.alt = '';
		drop.draggable = false;
		drop.style.left = `${8 + Math.random() * 84}%`;
		drop.style.setProperty('--fall-x', `${(Math.random() - 0.5) * 18}px`);
		drop.style.setProperty('--fall-rot', `${(Math.random() - 0.5) * 220}deg`);
		drop.style.setProperty('--fall-duration', `${0.75 + Math.random() * 0.35}s`);
		drop.style.setProperty('--fall-size', `${10 + Math.random() * 6}px`);

		active += 1;
		drop.addEventListener(
			'animationend',
			() => {
				drop.remove();
				active = Math.max(0, active - 1);
			},
			{ once: true },
		);
		rain.appendChild(drop);
	};

	link.addEventListener('mouseenter', () => {
		if (!canHoverRain()) return;
		stop();
		spawn();
		spawnTimer = setInterval(spawn, SPAWN_MS);
	});

	link.addEventListener('mouseleave', stop);
}
