// SA6: Reading progress bar + Scroll to top button
export const ReadingProgressScript = () => `
<div id="reading-progress-bar" style="position: fixed; top: 0; left: 0; width: 0%; height: 3px; background: linear-gradient(90deg, #e94560, #ff6b6b); z-index: 100000; transition: width 0.1s linear;"></div>

<button id="scroll-to-top" onclick="window.scrollTo({top: 0, behavior: 'smooth'})" aria-label="Przewiń do góry" title="Do góry"
  style="position: fixed; bottom: 24px; right: 24px; z-index: 99998; width: 44px; height: 44px; border-radius: 50%; background: #1a1a2e; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); opacity: 0; transform: translateY(10px); transition: opacity 0.3s, transform 0.3s; pointer-events: none;">
  ↑
</button>

<script>
(function() {
  var progressBar = document.getElementById('reading-progress-bar');
  var scrollBtn = document.getElementById('scroll-to-top');

  window.addEventListener('scroll', function() {
    // Reading progress
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';

    // Scroll to top button
    if (scrollTop > 400) {
      scrollBtn.style.opacity = '1';
      scrollBtn.style.transform = 'translateY(0)';
      scrollBtn.style.pointerEvents = 'auto';
    } else {
      scrollBtn.style.opacity = '0';
      scrollBtn.style.transform = 'translateY(10px)';
      scrollBtn.style.pointerEvents = 'none';
    }
  });
})();
</script>
`
