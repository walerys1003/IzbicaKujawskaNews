document.querySelectorAll('[data-video-player] video').forEach((video) => {
  video.addEventListener('play', () => video.closest('[data-video-player]')?.classList.add('is-playing'));
  video.addEventListener('pause', () => video.closest('[data-video-player]')?.classList.remove('is-playing'));
});
