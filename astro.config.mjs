// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://rnracing.org',
	outDir: 'docs',
	redirects: {
		'/reveal': '/design',
	},
	vite: {
		optimizeDeps: {
			include: ['three', 'three/addons/loaders/SVGLoader.js', 'gsap', 'canvas-confetti'],
		},
	},
});
