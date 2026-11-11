const revealItems = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

revealItems.forEach((item) => observer.observe(item));

// Parallax delicado no hero (desativado em telas touch/redução de movimento)
const hero = document.querySelector(".hero");
const heroPhoto = document.querySelector(".hero-photo-wrap");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (hero && heroPhoto && !reduceMotion && window.matchMedia("(pointer:fine)").matches) {
  hero.addEventListener("mousemove", (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    heroPhoto.style.marginTop = `${y * 12}px`;
    heroPhoto.style.marginRight = `${x * -12}px`;
  });
  hero.addEventListener("mouseleave", () => {
    heroPhoto.style.marginTop = "0";
    heroPhoto.style.marginRight = "0";
  });
}

// Galeria / lightbox
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const closeLightbox = () => {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
};
document.querySelectorAll(".gallery-item").forEach((item) => {
  item.addEventListener("click", () => {
    const image = item.querySelector("img");
    const source = item.dataset.full;
    if (!image || !image.complete || image.naturalWidth === 0) return;
    lightboxImage.src = source;
    lightboxImage.alt = image.alt;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  });
});
document.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLightbox();
});


// ==========================================
// NAYEON MEDIA PLAYER — SOUNDCLOUD
// ==========================================

const soundcloudIframe = document.getElementById("soundcloud-widget");

const playButton = document.getElementById("play");
const previousButton = document.getElementById("previous");
const nextButton = document.getElementById("next");
const muteButton = document.getElementById("mute");

const seek = document.getElementById("seek");
const volume = document.getElementById("volume");

const currentTimeLabel = document.getElementById("current-time");
const durationLabel = document.getElementById("duration");

const trackTitle = document.getElementById("track-title");
const trackArtist = document.getElementById("track-artist");

const albumImage = document.querySelector(".album-art img");
const playerWindow = document.querySelector(".player-window");
const soundHint = document.querySelector(".sound-hint");

let widget = null;
let widgetReady = false;
let isPlaying = false;
let isMuted = false;
let previousVolume = 70;
let durationMs = 0;

// Preenchimento visual das barras (slider)
const paintRange = (input) => {
  if (!input) return;
  const min = Number(input.min) || 0;
  const max = Number(input.max) || 100;
  const pct = ((Number(input.value) - min) / (max - min)) * 100;
  input.style.setProperty("--fill", `${Math.max(0, Math.min(100, pct))}%`);
};

const formatTime = (milliseconds) => {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return "0:00";

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);

  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
};

const showMessage = (message) => {
  if (soundHint) soundHint.textContent = message;
};

const updateTrack = (sound) => {
  if (!sound) return;

  trackTitle.textContent = sound.title || "Unknown track";
  trackArtist.textContent = sound.user?.username || "underscores";

  if (sound.artwork_url) {
    albumImage.src = sound.artwork_url;
    albumImage.style.opacity = "1";
  }

  durationMs = sound.duration || durationMs;
  durationLabel.textContent = formatTime(durationMs);

  seek.value = 0;
  paintRange(seek);
  currentTimeLabel.textContent = "0:00";
};

const refreshTrack = () => {
  if (!widgetReady) return;

  widget.getCurrentSound((sound) => {
    if (sound) updateTrack(sound);
  });

  widget.getDuration((duration) => {
    if (Number.isFinite(duration) && duration > 0) {
      durationMs = duration;
      durationLabel.textContent = formatTime(duration);
    }
  });
};

const setPlaying = (playing) => {
  isPlaying = playing;

  playButton.textContent = playing ? "Ⅱ" : "▶";
  playButton.setAttribute("aria-label", playing ? "Pausar" : "Reproduzir");

  playerWindow.classList.toggle("is-playing", playing);
};

const setPlayerVolume = (value) => {
  const normalized = Math.max(0, Math.min(100, value));

  widget.setVolume(normalized);

  volume.value = normalized / 100;
  paintRange(volume);
  isMuted = normalized === 0;

  muteButton.textContent = isMuted ? "♪̸" : "♫";
};

// Inicialização do SoundCloud
if (window.SC && soundcloudIframe) {
  widget = window.SC.Widget(soundcloudIframe);

  const events = window.SC.Widget.Events;

  widget.bind(events.READY, () => {
    widgetReady = true;

    widget.setVolume(70);

    refreshTrack();

    showMessage("PLAYLIST CONECTADA · UNDERSCORES — U");
  });

  widget.bind(events.PLAY, () => {
    setPlaying(true);
    refreshTrack();
  });

  widget.bind(events.PAUSE, () => {
    setPlaying(false);
  });

  widget.bind(events.PLAY_PROGRESS, (data) => {
    if (!data) return;

    currentTimeLabel.textContent = formatTime(data.currentPosition || 0);

    if (durationMs > 0) {
      seek.value = (data.currentPosition / durationMs) * 100;
      paintRange(seek);
    }
  });

  widget.bind(events.SEEK, () => {
    refreshTrack();
  });

  widget.bind(events.FINISH, () => {
    setPlaying(false);
    refreshTrack();
  });

  widget.bind(events.ERROR, () => {
    setPlaying(false);

    showMessage(
      "ERRO AO CARREGAR A PLAYLIST. TENTE ABRIR PELO SOUNDCLOUD."
    );
  });

} else {
  showMessage("NÃO FOI POSSÍVEL CARREGAR O SOUNDCLOUD.");
}

// Play / Pause
playButton.addEventListener("click", () => {
  if (!widgetReady) {
    showMessage("AGUARDE O CARREGAMENTO DA PLAYLIST...");
    return;
  }

  if (isPlaying) {
    widget.pause();
  } else {
    widget.play();
  }
});

// Faixa anterior
previousButton.addEventListener("click", () => {
  if (widgetReady) widget.prev();
});

// Próxima faixa
nextButton.addEventListener("click", () => {
  if (widgetReady) widget.next();
});

// Progresso
seek.addEventListener("input", () => {
  if (!widgetReady || durationMs <= 0) return;

  paintRange(seek);
  widget.seekTo((Number(seek.value) / 100) * durationMs);
});

// Volume
volume.addEventListener("input", () => {
  paintRange(volume);
  if (!widgetReady) return;

  const value = Number(volume.value) * 100;

  if (value > 0) previousVolume = value;

  isMuted = value === 0;

  widget.setVolume(value);

  muteButton.textContent = isMuted ? "♪̸" : "♫";
});

paintRange(seek);
paintRange(volume);

// Mudo
muteButton.addEventListener("click", () => {
  if (!widgetReady) return;

  if (isMuted) {
    setPlayerVolume(previousVolume || 70);
  } else {
    previousVolume = Number(volume.value) * 100 || 70;
    setPlayerVolume(0);
  }
});



// ==========================================
// PIXELDREAM — TEMA DIA / NOITE
// ==========================================
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = themeToggle?.querySelector(".theme-toggle-icon");
const themeLabel = themeToggle?.querySelector(".theme-toggle-label");

const applyTheme = (isNight) => {
  document.body.classList.toggle("night-mode", isNight);
  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isNight));
    themeToggle.setAttribute(
      "aria-label",
      isNight ? "Ativar modo diurno" : "Ativar modo noturno"
    );
  }
  if (themeIcon) themeIcon.textContent = isNight ? "☀" : "☾";
  if (themeLabel) themeLabel.textContent = isNight ? "DAY MODE" : "NIGHT MODE";
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    isNight ? "#071d38" : "#087db5"
  );
};

let savedTheme = "day";
try {
  savedTheme = localStorage.getItem("pixeldream-theme") || "day";
} catch (error) {
  // O tema continua funcionando mesmo se o navegador bloquear o armazenamento.
}
applyTheme(savedTheme === "night");

themeToggle?.addEventListener("click", () => {
  const isNight = !document.body.classList.contains("night-mode");
  applyTheme(isNight);
  try {
    localStorage.setItem("pixeldream-theme", isNight ? "night" : "day");
  } catch (error) {
    // A alternância permanece ativa durante esta visita.
  }
});

// ==========================================
// PIXELDREAM — CURSOR DE ESTRELINHA
// ==========================================
const sparkleCursor = document.getElementById("sparkle-cursor");
const finePointer = window.matchMedia("(pointer: fine)").matches;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (sparkleCursor && finePointer && !prefersReducedMotion) {
  document.body.classList.add("custom-cursor");
  let lastTrail = 0;

  window.addEventListener("mousemove", (event) => {
    sparkleCursor.style.left = `${event.clientX}px`;
    sparkleCursor.style.top = `${event.clientY}px`;
    sparkleCursor.classList.add("is-visible");

    const now = performance.now();
    if (now - lastTrail > 75) {
      lastTrail = now;
      const trail = document.createElement("span");
      trail.className = "cursor-trail";
      trail.textContent = Math.random() > 0.5 ? "✦" : "·";
      trail.style.left = `${event.clientX + (Math.random() * 16 - 8)}px`;
      trail.style.top = `${event.clientY + (Math.random() * 16 - 8)}px`;
      document.body.appendChild(trail);
      trail.addEventListener("animationend", () => trail.remove(), { once: true });
    }
  });

  document.addEventListener("mouseleave", () => {
    sparkleCursor.classList.remove("is-visible");
  });
  document.addEventListener("mouseenter", () => {
    sparkleCursor.classList.add("is-visible");
  });
}


// ==========================================
// PIXELDREAM — NAVEGAÇÃO, FADES E ROLAGEM
// ==========================================
const topbar = document.querySelector(".topbar");
const navLinks = [...document.querySelectorAll(".nav a")];

// Barra superior ganha vidro ao rolar
const updateTopbar = () => topbar?.classList.toggle("is-scrolled", window.scrollY > 40);
window.addEventListener("scroll", updateTopbar, { passive: true });
updateTopbar();

// Cada seção surge com um fade suave ao entrar na tela
const pageSections = document.querySelectorAll("main > section");
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      sectionObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
pageSections.forEach((section) => sectionObserver.observe(section));

// Link ativo no menu conforme a seção na tela
const linkById = new Map(
  navLinks.map((link) => [link.getAttribute("href").slice(1), link])
);
const spyObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.remove("is-active"));
    linkById.get(entry.target.id)?.classList.add("is-active");
  });
}, { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll("main > section[id]").forEach((section) => spyObserver.observe(section));
