/* The market stays fixed. Scroll only advances the friends along one winding road. */
(() => {
  'use strict';
  const road = document.querySelector('#partner-road');
  if (!road) return;
  const world = road.querySelector('.road-world');
  const friends = road.querySelector('.road-friends');
  const points = [[5,23],[92,23],[95,26],[95,45],[92,48],[8,48],[5,51],[5,70],[8,73],[92,73],[95,76],[95,95],[92,98],[5,98]];
  const dialog = document.querySelector('#partner-dialog');
  const dialogLogo = dialog.querySelector('img');
  let opener;
  road.querySelectorAll('.shop-open').forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      const shop = button.closest('.partner-shop');
      opener = button;
      dialog.querySelector('#partner-dialog-name').textContent = shop.querySelector('.shop-name').textContent;
      dialog.querySelector('#partner-dialog-role').textContent = shop.querySelector('.shop-role').textContent;
      const logo = shop.querySelector('.shop-logo');
      dialogLogo.hidden = !logo;
      if (logo) dialogLogo.src = logo.getAttribute('src');
      else dialogLogo.removeAttribute('src');
      dialog.showModal();
    });
  });
  dialog.addEventListener('close', () => {
    if (opener && !opener.closest('[inert]')) opener.focus({ preventScroll:true });
  });
  dialog.addEventListener('keydown', event => {
    // Escape belongs to the open board, even while the story music is playing.
    if (event.key === 'Escape') event.stopPropagation();
  });
  function render(progress) {
    const width = world.clientWidth || innerWidth;
    const height = world.clientHeight || innerHeight;
    const lengths = points.slice(1).map((point,index) => Math.hypot((point[0]-points[index][0])*width,(point[1]-points[index][1])*height));
    const total = lengths.reduce((sum,length) => sum+length,0);
    let remaining = Math.max(0,Math.min(1,(progress-.02)/.96))*total;
    let segment = 0;
    while (segment < lengths.length-1 && remaining > lengths[segment]) remaining -= lengths[segment++];
    const fraction = remaining/lengths[segment];
    const from = points[segment], to = points[segment+1];
    friends.style.left = `${from[0]+(to[0]-from[0])*fraction}%`;
    friends.style.top = `${from[1]+(to[1]-from[1])*fraction}%`;
    friends.style.setProperty('--walk-facing', to[0] < from[0] ? -1 : to[0] > from[0] ? 1 : segment < 5 ? 1 : segment < 8 ? -1 : 1);
    friends.style.setProperty('--walk-bob', `${Math.sin(progress*240)*1.6}px`);
    friends.style.setProperty('--walk-sway', `${Math.sin(progress*120)*1.1}deg`);
  }
  road.addEventListener('story-progress', event => render(event.detail));
  new MutationObserver(() => {
    if (!document.documentElement.classList.contains('cinematic')) friends.removeAttribute('style');
  }).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
})();
