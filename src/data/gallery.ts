/**
 * Hard-coded gallery URLs. Extensions match the preserved upload filenames.
 * width/height were measured from the actual R2 objects (JPEG SOF) so the layout
 * engine can plan pages without downloading every full-resolution file up front.
 * Orientation is never stored — it is derived from aspect ratio at runtime.
 */
export const galleryImages = [
	{ src: 'https://media.munixnet.org/rnracing/gallery/001.JPG', width: 6192, height: 4128 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/002.JPG', width: 4898, height: 3265 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/003.JPG', width: 6192, height: 4128 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/004.JPG', width: 6192, height: 4128 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/005.JPG', width: 6192, height: 4128 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/006.JPG', width: 6192, height: 4128 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/007.JPG', width: 4898, height: 3265 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/008.JPG', width: 4898, height: 3265 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/009.JPG', width: 6192, height: 4128 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/010.JPG', width: 6192, height: 4128 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/011.JPG', width: 6192, height: 4128 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/012.JPG', width: 6192, height: 4128 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/013.JPG', width: 6192, height: 4128 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/014.JPG', width: 6192, height: 4128 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/015.JPG', width: 4898, height: 3265 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/016.JPG', width: 4898, height: 3265 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/017.JPG', width: 4898, height: 3265 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/018.JPG', width: 6192, height: 4128 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/019.JPG', width: 6192, height: 4128 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/020.JPG', width: 4898, height: 3265 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/021.jpg', width: 6720, height: 4480 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/022.jpg', width: 6720, height: 4480 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/023.jpg', width: 6720, height: 4480 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/024.jpg', width: 6720, height: 4480 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/025.jpg', width: 6720, height: 4480 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/026.jpg', width: 6720, height: 4480 },
	{ src: 'https://media.munixnet.org/rnracing/gallery/027.jpg', width: 6960, height: 4640 },
] as const;

export const GALLERY_PHOTO_COUNT = galleryImages.length;

export type GalleryImageEntry = (typeof galleryImages)[number];
