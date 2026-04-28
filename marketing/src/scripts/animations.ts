// CurlBro marketing v5 — minimal motion engine.
//
// Total motion budget for the page:
//   1. Top-nav active-section underline (intersection observer)
//   2. Reading progress bar (scroll listener, rAF-throttled)
//   3. Sticky-title shrink-on-pin (intersection observer per section)
//   4. Hero email-form reveal (button click toggles class)
//   5. Section 2: pinned phone + video scrub by scroll progress
//   6. Background pulse in Section 2 (CSS keyframe, no JS)
//
// Everything else from v2-v4 is dead. No GSAP. No cursor halo. No magnetic
// buttons. No parallax. No letter reveals. No word reveals. No edge draws.
// No confetti. No shake. No easter egg.
//
// Reduced-motion users get a clean static page: the form still reveals
// (functional), but the video scrub falls back to a single frame and the
// background pulse goes static.

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ────────────────────────────────────────────────────────────────────────
// 1. Top-nav active-section indicator
// ────────────────────────────────────────────────────────────────────────

function initActiveNav() {
  const navLinks =
    document.querySelectorAll<HTMLAnchorElement>('[data-nav-target]');
  if (!navLinks.length) return;

  const sections = Array.from(navLinks)
    .map((a) => {
      const id = a.getAttribute('data-nav-target');
      return id ? document.getElementById(id) : null;
    })
    .filter((el): el is HTMLElement => el !== null);

  if (!sections.length) return;

  const setActive = (activeId: string | null) => {
    navLinks.forEach((a) => {
      a.classList.toggle(
        'is-active',
        a.getAttribute('data-nav-target') === activeId,
      );
    });
  };

  // Use intersection observer with a horizontal slice of the viewport so
  // the active section is whichever one is currently centered.
  const observer = new IntersectionObserver(
    (entries) => {
      // Pick the entry with the highest intersection ratio that's still in view.
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length) {
        setActive(visible[0].target.id);
      }
    },
    {
      // Slice the viewport so a section is "active" when its body sits
      // around the upper-middle. Avoids flicker between adjacent sections.
      rootMargin: '-30% 0% -55% 0%',
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    },
  );

  sections.forEach((s) => observer.observe(s));
}

// ────────────────────────────────────────────────────────────────────────
// 2. Reading progress bar
// ────────────────────────────────────────────────────────────────────────

function initReadingProgress() {
  const fill = document.querySelector<HTMLElement>(
    '[data-reading-progress-fill]',
  );
  if (!fill) return;

  let ticking = false;

  const update = () => {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
    fill.style.width = `${progress * 100}%`;
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

// ────────────────────────────────────────────────────────────────────────
// 3. Sticky-title shrink-on-pin
//
// Each <div class="sticky-title"> gets is-pinned added when its section is
// scrolled into the pinned region. Detection: a sentinel right above the
// title; once it leaves the viewport-top region, the title is "pinned."
// ────────────────────────────────────────────────────────────────────────

function initStickyTitleShrink() {
  const titles =
    document.querySelectorAll<HTMLElement>('[data-sticky-title]');

  titles.forEach((title) => {
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.position = 'absolute';
    sentinel.style.top = '0';
    sentinel.style.left = '0';
    sentinel.style.right = '0';
    sentinel.style.height = '1px';
    sentinel.style.pointerEvents = 'none';

    // Place sentinel just above the title. Title's section is its closest
    // [data-section] ancestor; we attach the sentinel to that section.
    const section = title.closest<HTMLElement>('[data-section]') ?? title.parentElement;
    if (!section) return;

    if (getComputedStyle(section).position === 'static') {
      section.style.position = 'relative';
    }
    section.insertBefore(sentinel, section.firstChild);

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel leaves the top, title is pinned.
        title.classList.toggle('is-pinned', !entry.isIntersecting);
      },
      {
        rootMargin: '-65px 0px 0px 0px', // account for top nav (52px) + a little
        threshold: 0,
      },
    );
    observer.observe(sentinel);
  });
}

// ────────────────────────────────────────────────────────────────────────
// 4. Hero email-form reveal
// ────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────
// Nav anchor scrolling — for sections with sticky body-pin, scroll into the
// section past its entry phase so the body lands in its locked center
// position. For sections without body-pin, scroll to top normally.
// ────────────────────────────────────────────────────────────────────────

function initSmoothAnchors() {
  const links = document.querySelectorAll<HTMLAnchorElement>(
    'a[href^="#"]:not([href="#"])',
  );
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href?.startsWith('#')) return;
      const target = document.querySelector<HTMLElement>(href);
      if (!target) return;

      e.preventDefault();

      const sectionTop = window.scrollY + target.getBoundingClientRect().top;
      const hasBodyPin = !!target.querySelector('.section-body-pin');

      // Scroll deeper into sections that have body-pin so the body lands
      // in its centered locked position, with the sticky title at the top.
      // ~30vh of section scroll-into puts body just past pin trigger and
      // title firmly docked.
      const offset = hasBodyPin ? window.innerHeight * 0.3 : 0;

      window.scrollTo({
        top: sectionTop + offset,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });

      try {
        history.replaceState(null, '', href);
      } catch {
        /* noop */
      }
    });
  });
}

function initFormReveal() {
  const trigger = document.querySelector<HTMLButtonElement>(
    '[data-form-reveal-trigger]',
  );
  const wrap = document.querySelector<HTMLElement>('[data-form-reveal-wrap]');
  const firstInput = wrap?.querySelector<HTMLInputElement>('input[type="text"], input[name="firstName"]');

  if (!trigger || !wrap) return;

  const open = () => {
    wrap.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    setTimeout(() => firstInput?.focus(), 320);
  };

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    if (wrap.classList.contains('is-open')) {
      // already open — just focus the first field
      firstInput?.focus();
      return;
    }
    open();
  });
}

// ────────────────────────────────────────────────────────────────────────
// 5. Section 2: pinned phone + video scrub
//
// Layout: each beat occupies ~95vh of scroll. The phone is sticky in its
// column; videos stack on top of one another, only the active beat's video
// is opacity:1. Within each beat's scroll range, the active video's
// currentTime is set proportionally to scroll progress.
// ────────────────────────────────────────────────────────────────────────

function initIPhoneSection() {
  const beats = Array.from(
    document.querySelectorAll<HTMLElement>('[data-iphone-beat]'),
  );
  const videos = Array.from(
    document.querySelectorAll<HTMLVideoElement>('[data-iphone-video]'),
  );
  const stage = document.querySelector<HTMLElement>('[data-iphone-stage]');

  if (!beats.length || !videos.length || !stage) return;

  // Map beat id → video element
  const videoByBeat = new Map<string, HTMLVideoElement>();
  videos.forEach((v) => {
    const id = v.getAttribute('data-iphone-video');
    if (id) videoByBeat.set(id, v);
  });

  // Activate the first video on init so something is showing before scroll.
  const firstBeatId = beats[0].getAttribute('data-iphone-beat');
  if (firstBeatId) {
    const firstVideo = videoByBeat.get(firstBeatId);
    if (firstVideo) firstVideo.classList.add('is-active');
  }
  beats[0].classList.add('is-active');

  // Detect which beat is currently centered. Use a single observer with the
  // viewport center as the trigger.
  let activeBeatId: string | null = firstBeatId;

  const beatObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-iphone-beat');
          if (!id || id === activeBeatId) return;
          activeBeatId = id;
          beats.forEach((b) =>
            b.classList.toggle(
              'is-active',
              b.getAttribute('data-iphone-beat') === id,
            ),
          );
          videos.forEach((v) =>
            v.classList.toggle(
              'is-active',
              v.getAttribute('data-iphone-video') === id,
            ),
          );
          // Reset time of newly-active video so it starts fresh.
          const v = videoByBeat.get(id);
          if (v && Number.isFinite(v.duration)) {
            v.currentTime = 0;
          }
        }
      });
    },
    {
      // Active beat = the one with its center near the viewport center.
      rootMargin: '-45% 0% -45% 0%',
      threshold: 0,
    },
  );
  beats.forEach((b) => beatObserver.observe(b));

  // Force each video to decode its first frame. Without this, browsers
  // (especially Safari and Firefox) don't render anything for muted
  // <video> elements that haven't been played at least once — the user
  // sees the dark phone-frame bezel through them and assumes nothing loaded.
  const kickVideo = (v: HTMLVideoElement) => {
    const tryKick = () => {
      const p = v.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          v.pause();
          v.currentTime = 0;
        }).catch(() => {
          // Autoplay blocked — set currentTime to nudge a frame decode
          try { v.currentTime = 0.01; } catch { /* noop */ }
        });
      }
    };
    if (v.readyState >= 1) tryKick();
    else v.addEventListener('loadedmetadata', tryKick, { once: true });
  };
  videos.forEach(kickVideo);

  if (prefersReducedMotion) return; // skip scrub; videos stay paused

  // ────────────────────────────────────────────────────────────────────
  // Smooth scrub via rAF loop with lerp easing.
  //
  // Naive `video.currentTime = scrollProgress * duration` ties the video
  // 1:1 to scroll velocity, which feels mechanical — every scroll-event
  // jolt becomes a visible video jolt. Instead, we maintain a target time
  // (updated by scroll events) and a current time (eased toward target on
  // every animation frame). The lerp factor controls how quickly the
  // video catches up: lower = smoother but laggier.
  // ────────────────────────────────────────────────────────────────────

  const DEADZONE_START = 0.45; // phone locked, pause before video begins
  const DEADZONE_END = 0.42;   // long deliberate hold on last frame before next beat takes over
  const SPLASH_FADE_START = 0.34; // splash holds fully opaque through the long lock-pause
  const SPLASH_FADE_END = 0.45;   // splash fully gone exactly as video begins scrubbing
  const LERP = 0.12;            // 0.05 = very smooth & laggy; 0.25 = snappy; 0.12 = balanced
  const SNAP_THRESHOLD = 0.01;  // seconds — below this, snap to target to avoid float drift

  let targetTime = 0;
  let currentTime = 0;
  let rafId: number | null = null;

  const computeTargetForActiveBeat = () => {
    if (!activeBeatId) return 0;
    const beatEl = beats.find(
      (b) => b.getAttribute('data-iphone-beat') === activeBeatId,
    );
    const video = videoByBeat.get(activeBeatId);
    if (
      !beatEl ||
      !video ||
      !Number.isFinite(video.duration) ||
      video.duration <= 0
    ) {
      return 0;
    }
    const rect = beatEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const span = rect.height + vh;
    const beatCenter = rect.top + rect.height / 2;
    const traveled = vh + rect.height / 2 - beatCenter;
    const progress = Math.max(0, Math.min(1, traveled / span));

    const scrubRange = 1 - DEADZONE_START - DEADZONE_END;
    let scrubProgress: number;
    if (progress < DEADZONE_START) {
      scrubProgress = 0;
    } else if (progress > 1 - DEADZONE_END) {
      scrubProgress = 1;
    } else {
      scrubProgress = (progress - DEADZONE_START) / scrubRange;
    }

    // First-beat splash fade: opacity 1 while phone scrolls in, fades to 0
    // as phone locks into its pinned position, fully gone before scrub begins.
    const splashEl = beatEl.querySelector<HTMLElement>('[data-video-splash]');
    if (splashEl) {
      let splashOpacity = 1;
      if (progress >= SPLASH_FADE_END) splashOpacity = 0;
      else if (progress > SPLASH_FADE_START) {
        splashOpacity =
          1 - (progress - SPLASH_FADE_START) / (SPLASH_FADE_END - SPLASH_FADE_START);
      }
      splashEl.style.setProperty('--splash-opacity', String(splashOpacity));
    }

    return scrubProgress * video.duration;
  };

  const tick = () => {
    targetTime = computeTargetForActiveBeat();
    const delta = targetTime - currentTime;
    if (Math.abs(delta) < SNAP_THRESHOLD) {
      currentTime = targetTime;
    } else {
      currentTime += delta * LERP;
    }
    if (activeBeatId) {
      const v = videoByBeat.get(activeBeatId);
      if (v && Number.isFinite(v.duration)) {
        // Only assign if delta is meaningful — avoid setter overhead each frame
        if (Math.abs(v.currentTime - currentTime) > 0.005) {
          v.currentTime = currentTime;
        }
      }
    }
    rafId = window.requestAnimationFrame(tick);
  };

  // When the active beat changes, snap currentTime to the beat-start so we
  // don't see a quick rewind from the previous beat's last frame.
  const originalBeatObserver = beatObserver;
  // (already wired above; we hook into the same intersection callback by
  //  resetting currentTime/targetTime when an is-active beat is set)
  void originalBeatObserver;
  const observer2 = new MutationObserver(() => {
    // active beat changed — reset currentTime so video starts at frame 0
    currentTime = 0;
    targetTime = 0;
  });
  beats.forEach((b) =>
    observer2.observe(b, { attributes: true, attributeFilter: ['class'] }),
  );

  videos.forEach((v) => {
    if (v.readyState >= 1) return;
    v.addEventListener('loadedmetadata', () => {}, { once: true });
  });

  rafId = window.requestAnimationFrame(tick);
  void rafId;
}

// ────────────────────────────────────────────────────────────────────────
// init
// ────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────
// Pin-stack lock detection — toggle .is-locked when the wrapper pins, so
// CSS can transition the body's margin-top from "wide entry gap" to
// "centered locked gap".
// ────────────────────────────────────────────────────────────────────────

function initPinStackLock() {
  const stacks = document.querySelectorAll<HTMLElement>('.pin-stack');
  if (!stacks.length) return;

  let ticking = false;

  const update = () => {
    stacks.forEach((stack) => {
      const rect = stack.getBoundingClientRect();
      // Wrapper is sticky at top:64; consider it locked when its top is at
      // or near 64. Small tolerance for sub-pixel scroll.
      const isPinned = rect.top <= 65;
      stack.classList.toggle('is-locked', isPinned);
    });
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

function init() {
  initActiveNav();
  initReadingProgress();
  initStickyTitleShrink();
  initSmoothAnchors();
  initFormReveal();
  initIPhoneSection();
  initPinStackLock();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}

export {};
