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

// Player de áudio: coloque sua faixa em assets/track.mp3
const audio = document.getElementById("audio");
const playButton = document.getElementById("play");
const seek = document.getElementById("seek");
const volume = document.getElementById("volume");
const muteButton = document.getElementById("mute");
const restartButton = document.getElementById("restart");
const currentTimeLabel = document.getElementById("current-time");
const durationLabel = document.getElementById("duration");
const playerWindow = document.querySelector(".player-window");

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

playButton.addEventListener("click", async () => {
  if (!audio.src || audio.error) {
    document.querySelector(".sound-hint").textContent =
      "ADICIONE UM ARQUIVO MP3 EM assets/track.mp3 PARA USAR O PLAYER.";
    return;
  }
  if (audio.paused) {
    try { await audio.play(); } catch (error) {
      document.querySelector(".sound-hint").textContent =
        "NÃO FOI POSSÍVEL REPRODUZIR. CONFIRA O ARQUIVO assets/track.mp3.";
    }
  } else {
    audio.pause();
  }
});

audio.addEventListener("play", () => {
  playButton.textContent = "Ⅱ";
  playerWindow.classList.add("is-playing");
});
audio.addEventListener("pause", () => {
  playButton.textContent = "▶";
  playerWindow.classList.remove("is-playing");
});
audio.addEventListener("loadedmetadata", () => {
  durationLabel.textContent = formatTime(audio.duration);
});
audio.addEventListener("timeupdate", () => {
  currentTimeLabel.textContent = formatTime(audio.currentTime);
  durationLabel.textContent = formatTime(audio.duration);
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    seek.value = (audio.currentTime / audio.duration) * 100;
  }
});
seek.addEventListener("input", () => {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    audio.currentTime = (Number(seek.value) / 100) * audio.duration;
  }
});
volume.addEventListener("input", () => {
  audio.volume = Number(volume.value);
  audio.muted = audio.volume === 0;
  muteButton.textContent = audio.muted ? "♪̸" : "♫";
});
muteButton.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteButton.textContent = audio.muted ? "♪̸" : "♫";
});
restartButton.addEventListener("click", () => {
  audio.currentTime = 0;
  if (audio.paused) audio.play().catch(() => {});
});
audio.volume = Number(volume.value);
