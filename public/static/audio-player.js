document.querySelectorAll('[data-audio-player] audio').forEach((audio) => {
  audio.addEventListener('play', () => audio.closest('[data-audio-player]')?.classList.add('is-playing'));
  audio.addEventListener('pause', () => audio.closest('[data-audio-player]')?.classList.remove('is-playing'));
});
