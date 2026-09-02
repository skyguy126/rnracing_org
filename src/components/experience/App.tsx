import { useRef, useEffect, useState } from "react";

const TEAM = [
  { name: "Vamsi", title: "Co-Founder" },
  { name: "Rohith", title: "Co-Founder" },
  { name: "Kamran", title: "Head of HR" },
  { name: "Nyle", title: "CEO & Team Captain" },
  { name: "Danial", title: "Lead Chirp Systems Engineer" },
  { name: "Varoon", title: "General Counsel" },
  { name: "Vasu", title: "Garage Supervisor" },
  { name: "Sid", title: "HR Intern" },
  { name: "Baggy", title: "Director of Ragebait" },
];

const TOTAL_FRAMES = 169;

function frameSrc(i: number): string {
  return `/frames/frame-${String(i + 1).padStart(3, "0")}.jpg`;
}

/**
 * Maps scroll (0–1) → frame index (0–168).
 *
 *   0.00 – 0.05  hero hold        → frame 0
 *   0.05 – 0.45  forward          → frame 0 → 168
 *   0.45 – 0.85  reverse          → frame 168 → 0
 *   0.85 – 1.00  people / footer  → frame 0
 */
function scrollToFrame(scroll: number): number {
  if (scroll <= 0.05) return 0;
  if (scroll <= 0.45) {
    const t = (scroll - 0.05) / 0.4;
    return Math.round(t * (TOTAL_FRAMES - 1));
  }
  if (scroll <= 0.85) {
    const t = (scroll - 0.45) / 0.4;
    return Math.round((1 - t) * (TOTAL_FRAMES - 1));
  }
  return 0;
}

function preloadFrames(): Promise<HTMLImageElement[]> {
  return Promise.all(
    Array.from({ length: TOTAL_FRAMES }, (_, i) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = frameSrc(i);
      });
    })
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const lastFrameRef = useRef(-1);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    preloadFrames().then((imgs) => {
      framesRef.current = imgs;
      setLoaded(true);

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = imgs[0].naturalWidth;
        canvas.height = imgs[0].naturalHeight;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (ctx) ctx.drawImage(imgs[0], 0, 0);
      }
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !ctx) return;

    const paint = (frame: number) => {
      if (frame === lastFrameRef.current) return;
      lastFrameRef.current = frame;
      ctx.drawImage(framesRef.current[frame], 0, 0);
    };

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const scroll = max > 0 ? window.scrollY / max : 0;
      const frame = scrollToFrame(Math.min(scroll, 1));
      requestAnimationFrame(() => paint(frame));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [loaded]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".fade-in").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <div className="video-wrap">
        <canvas ref={canvasRef} className="video-bg" />
        {!loaded && <div className="video-loader">Loading…</div>}
      </div>

      <div className="vignette" />

      <div className="scroll-track">
        {/* HERO */}
        <section className="panel hero-panel">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="hero-rn">RN</span>
              <span className="hero-racing">RACING</span>
            </h1>
            <p className="hero-tag">24 Hours of Lemons&ensp;·&ensp;Bay Area</p>
          </div>
          <div className="scroll-cue">
            <span>scroll to explode</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </section>

        {/* Forward playback zone */}
        <section className="panel" />

        <section className="panel story-panel">
          <div className="card fade-in">
            <p className="text-xl">
              What happens when a bunch of friends from the Bay Area buy a
              &rsquo;96&nbsp;Camry for&nbsp;$500?
            </p>
          </div>
        </section>

        <section className="panel story-panel">
          <div className="card fade-in">
            <p className="text-hero">They race it.</p>
          </div>
        </section>

        <section className="panel story-panel">
          <div className="card fade-in">
            <p className="text-xl">9&nbsp;friends. 1&nbsp;car. Zero&nbsp;experience.</p>
            <p className="text-sub">
              Welcome to the 24&nbsp;Hours of Lemons&nbsp;— the world&rsquo;s
              most accessible endurance racing series.
            </p>
          </div>
        </section>

        {/* Reverse playback zone — car reassembles */}
        <section className="panel story-panel">
          <div className="card fade-in">
            <p className="text-xl">
              Born from weekend wrenching and terrible financial&nbsp;decisions.
            </p>
          </div>
        </section>

        <section className="panel story-panel">
          <div className="card fade-in">
            <p className="text-xl">
              Every&nbsp;bolt.<br />
              Every&nbsp;lap.<br />
              Every&nbsp;moment.
            </p>
          </div>
        </section>

        <section className="panel number-panel">
          <div className="fade-in">
            <span className="car-number">#71</span>
          </div>
        </section>

        {/* TEAM — video is back at frame 0 */}
        <section className="panel team-panel">
          <h2 className="section-heading fade-in">THE CREW</h2>
          <div className="team-grid">
            {TEAM.map((m, i) => (
              <div
                key={m.name}
                className="team-card fade-in"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span className="team-name">{m.name}</span>
                <span className="team-role">{m.title}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER NAV + LINKS */}
        <section className="panel footer-panel">
          <div className="footer-inner fade-in">
            <nav className="footer-nav" aria-label="Site pages">
              <a href="/changelog" className="footer-nav-link">Build Log</a>
              <a href="/team" className="footer-nav-link">The Crew</a>
              <a href="/about" className="footer-nav-link">Who We Are</a>
            </nav>

            <div className="footer-divider" />

            <a
              href="https://www.instagram.com/_rnracing_/"
              target="_blank"
              rel="noopener noreferrer"
              className="ig-link"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              <span>@_rnracing_</span>
            </a>
            <p className="footer-phrase">See you at the track.</p>
            <p className="footer-copy">&copy; {new Date().getFullYear()} RN Racing</p>
          </div>
        </section>
      </div>
    </>
  );
}
