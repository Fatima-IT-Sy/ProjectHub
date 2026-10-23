// Home page for visitors: animations and small interactions.
// Uses GSAP + ScrollTrigger when they are loaded. Without them, the page still shows everything.

function setupLanding() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = window.gsap && window.ScrollTrigger;

  setupNavbarOnScroll();
  setupStorySteps();
  setupHeroHover();
  setupBentoLight();

  // No animations: show the final state right away
  if (reduceMotion || !hasGsap) {
    window.landingStarted = true;
    document.documentElement.classList.add("show-all");
    document.getElementById("bento").classList.add("in");
    return;
  }

  window.landingStarted = true;
  document.documentElement.classList.add("anim");
  gsap.registerPlugin(ScrollTrigger);

  playHeroIntro();
  setupHeroTilt();
  setupScrollAnimations();
}

// Navbar becomes glass after the page is scrolled
function setupNavbarOnScroll() {
  const navbar = document.getElementById("navbar");

  function updateNavbar() {
    navbar.classList.toggle("scrolled", window.scrollY > 10);
  }

  window.addEventListener("scroll", updateNavbar, { passive: true });
  updateNavbar();
}

// ---------- Hero ----------

function playHeroIntro() {
  const scene = document.getElementById("matchScene");
  const lines = scene.querySelectorAll(".match-line");
  const flows = scene.querySelectorAll(".match-flow");
  const progressFill = document.getElementById("teamProgressFill");
  const progressCount = document.getElementById("teamProgressCount");

  // Start with an empty team
  scene.classList.add("connecting");
  progressFill.style.width = "0%";
  progressCount.textContent = "0";
  lines.forEach(function (line) {
    const length = line.getTotalLength();
    line.style.strokeDasharray = length;
    line.style.strokeDashoffset = length;
  });
  gsap.set(flows, { opacity: 0 });

  const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

  // Text first: the heading, then the description
  intro.from("[data-hero]", { autoAlpha: 0, y: 28, duration: 0.9, stagger: 0.12 });

  // Then the picture
  intro.set("#matchStage", { autoAlpha: 1 }, 0.3);
  intro.from(".match-glow", { autoAlpha: 0, scale: 0.6, duration: 1.4 }, 0.3);
  intro.from(".ring", { autoAlpha: 0, scale: 0.85, transformOrigin: "50% 50%", duration: 1.2, stagger: 0.15 }, 0.4);
  intro.from(".project-card", { autoAlpha: 0, scale: 0.85, y: 20, duration: 0.9, ease: "back.out(1.4)" }, 0.7);
  intro.fromTo(".person", {
    autoAlpha: 0,
    x: function (index) {
      return index % 2 === 0 ? -40 : 40;
    }
  }, {
    autoAlpha: 1,
    x: 0,
    duration: 0.8,
    stagger: 0.12,
    clearProps: "all"
  }, 1);
  intro.from(".person .skill", { autoAlpha: 0, scale: 0.6, duration: 0.4, stagger: 0.1, ease: "back.out(2)" }, 1.4);
  intro.from(".example-tag", { autoAlpha: 0, duration: 0.6 }, 1.5);

  // Connect the students to the team one by one
  const order = ["front", "back", "design", "data"];
  order.forEach(function (skill, index) {
    const start = 1.9 + index * 0.45;
    const line = scene.querySelector('.match-line[data-skill="' + skill + '"]');

    intro.to(line, { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" }, start);
    intro.call(function () {
      scene.querySelector('.person[data-skill="' + skill + '"]').classList.add("matched");
      scene.querySelector('.slot[data-skill="' + skill + '"]').classList.add("filled");
      progressCount.textContent = index + 1;
      progressFill.style.width = ((index + 1) / order.length) * 100 + "%";
    }, null, start + 0.55);
  });

  // The team is complete
  intro.to(flows, { opacity: 1, duration: 0.6 }, 4);
  intro.call(function () {
    scene.classList.add("team-ready");
  }, null, 4);
}

// The picture turns a little with the mouse
function setupHeroTilt() {
  const hero = document.querySelector(".hero");
  const scene = document.getElementById("matchScene");
  const glow = document.querySelector(".match-glow");

  if (!window.matchMedia("(pointer: fine)").matches) {
    return;
  }

  hero.addEventListener("mousemove", function (event) {
    const box = hero.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;

    gsap.to(scene, { rotateY: x * 8, rotateX: -y * 8, duration: 0.8, ease: "power2.out" });
    gsap.to(glow, { x: x * -40, y: y * -40, duration: 1.2, ease: "power2.out" });
  });

  hero.addEventListener("mouseleave", function () {
    gsap.to(scene, { rotateY: 0, rotateX: 0, duration: 1, ease: "power2.out" });
    gsap.to(glow, { x: 0, y: 0, duration: 1.2 });
  });
}

// Hovering a student or a skill highlights the matching line
function setupHeroHover() {
  const scene = document.getElementById("matchScene");
  const items = scene.querySelectorAll(".person, .slot");

  items.forEach(function (item) {
    const skill = item.dataset.skill;

    item.addEventListener("mouseenter", function () {
      scene.classList.add("focus");
      scene.querySelectorAll('[data-skill="' + skill + '"]').forEach(function (element) {
        element.classList.add("is-hot");
      });
    });

    item.addEventListener("mouseleave", function () {
      scene.classList.remove("focus");
      scene.querySelectorAll(".is-hot").forEach(function (element) {
        element.classList.remove("is-hot");
      });
    });
  });
}

// ---------- How ProjectHub works ----------

function setupStorySteps() {
  const steps = Array.from(document.querySelectorAll(".story-step"));
  const scenes = Array.from(document.querySelectorAll(".scene"));
  const label = document.getElementById("storyLabel");
  const labels = ["Step 1 · Add your skills", "Step 2 · Find or create a team", "Step 3 · Send or accept requests"];
  const desktop = window.matchMedia("(min-width: 992px)");

  // Number the parts of each picture so they appear one after another
  scenes.forEach(function (scene) {
    scene.querySelectorAll(".pop").forEach(function (part, index) {
      part.style.setProperty("--i", index);
    });
  });

  if (!("IntersectionObserver" in window)) {
    scenes.forEach(function (scene) {
      scene.classList.add("active");
    });
    return;
  }

  // Update active step
  function showStep(index) {
    steps.forEach(function (step, i) {
      step.classList.toggle("active", i === index);
    });
    scenes.forEach(function (scene, i) {
      scene.classList.toggle("active", i === index);
    });
    label.textContent = labels[index];
  }

  // Desktop: the step in the middle of the screen controls the picture
  const stepObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && desktop.matches) {
        showStep(steps.indexOf(entry.target));
      }
    });
  }, { rootMargin: "-45% 0px -45% 0px" });

  steps.forEach(function (step) {
    stepObserver.observe(step);
  });

  // Mobile: each picture plays once when it comes into view
  const sceneObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !desktop.matches) {
        entry.target.classList.add("active");
      }
    });
  }, { threshold: 0.4 });

  scenes.forEach(function (scene) {
    sceneObserver.observe(scene);
  });
}

// ---------- Team types ----------

// Soft light follows the mouse inside each card
function setupBentoLight() {
  document.querySelectorAll(".bento-card").forEach(function (card) {
    card.addEventListener("mousemove", function (event) {
      const box = card.getBoundingClientRect();
      card.style.setProperty("--mx", event.clientX - box.left + "px");
      card.style.setProperty("--my", event.clientY - box.top + "px");
    });
  });
}

// ---------- Scroll animations ----------

function setupScrollAnimations() {
  // Section headings appear before their content
  document.querySelectorAll("[data-head]").forEach(function (head) {
    gsap.from(head.children, {
      autoAlpha: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: { trigger: head, start: "top 82%" }
    });
  });

  // Slow movement of the background and the hero while scrolling
  gsap.to(".aurora-layer", {
    yPercent: -12,
    ease: "none",
    scrollTrigger: { trigger: ".landing", start: "top top", end: "bottom bottom", scrub: true }
  });
  gsap.to(".hero-text", {
    y: -50,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });
  gsap.to("#matchStage", {
    y: -90,
    scale: 0.95,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });

  const media = gsap.matchMedia();

  // Desktop: the window slides in and the line fills while scrolling the steps
  media.add("(min-width: 992px)", function () {
    gsap.from(".story-window", {
      autoAlpha: 0,
      y: 60,
      scale: 0.96,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: ".story-grid", start: "top 78%" }
    });
    gsap.fromTo(".story-rail-fill", { scaleY: 0 }, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: { trigger: ".story-steps", start: "top center", end: "bottom center", scrub: true }
    });
  });

  // Mobile: each picture slides in under its step
  media.add("(max-width: 991px)", function () {
    gsap.utils.toArray(".scene").forEach(function (scene) {
      gsap.from(scene, {
        autoAlpha: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: scene, start: "top 88%" }
      });
    });
  });

  // Team type cards enter one after another, then their pictures play
  const bento = document.getElementById("bento");
  gsap.from(".bento-card", {
    autoAlpha: 0,
    y: 70,
    scale: 0.95,
    duration: 1,
    stagger: 0.15,
    ease: "power3.out",
    clearProps: "all",
    scrollTrigger: {
      trigger: bento,
      start: "top 78%",
      onEnter: function () {
        bento.classList.add("in");
      }
    }
  });

  // Final section
  gsap.from("#finalPanel", {
    autoAlpha: 0,
    y: 80,
    scale: 0.92,
    duration: 1.2,
    ease: "power3.out",
    scrollTrigger: { trigger: "#finalPanel", start: "top 85%" }
  });
  gsap.from(".final-content > *", {
    autoAlpha: 0,
    y: 24,
    duration: 0.7,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: { trigger: "#finalPanel", start: "top 72%" }
  });
}
