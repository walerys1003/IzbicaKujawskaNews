(() => {
  if (window.__izbicaTextToSpeech) return;
  window.__izbicaTextToSpeech = true;

  const synth = window.speechSynthesis;
  if (!synth) return;

  const boot = () => {
    const article = document.querySelector('.article-page');
    const body = document.querySelector('.article-body');
    const actions = document.querySelector('.byline-actions');
    if (!article || !body || !actions || actions.querySelector('.tts-toggle-btn')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'byline-btn tts-toggle-btn';
    button.textContent = '🔊 Czytaj';
    actions.appendChild(button);

    let speaking = false;
    const buildText = () => Array.from(body.querySelectorAll('p')).map((p) => p.textContent || '').join(' ');

    button.addEventListener('click', () => {
      if (speaking) {
        synth.cancel();
        speaking = false;
        button.textContent = '🔊 Czytaj';
        return;
      }
      const utterance = new SpeechSynthesisUtterance(buildText());
      const voice = synth.getVoices().find((item) => item.lang.toLowerCase().startsWith('pl'));
      if (voice) utterance.voice = voice;
      utterance.lang = 'pl-PL';
      utterance.rate = 1;
      utterance.onend = () => {
        speaking = false;
        button.textContent = '🔊 Czytaj';
      };
      synth.cancel();
      synth.speak(utterance);
      speaking = true;
      button.textContent = '⏸ Zatrzymaj';
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

