/* Bound iOS scene resources without changing the native document or scene order. */
(() => {
  'use strict';
  if (!document.documentElement.classList.contains('ios-native-scroll')) return;
  const empty = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E';
  const scenes = [...document.querySelectorAll('.scene')];
  const groups = [...scenes, document.querySelector('.finale')].filter(Boolean).map(element => ({
    element, parked:false,
    media:[...element.querySelectorAll('source[srcset],img[src],svg image[href]')].map(node => ({node, saved:null, loading:node.getAttribute("loading")})),
  }));
  let enabled = false, current = -1;
  function track(group) {
    const known = new Set(group.media.map(item=>item.node));
    for (const node of group.element.querySelectorAll('source[srcset],img[src],svg image[href]'))
      if (!known.has(node)) group.media.push({node,saved:null,loading:node.getAttribute('loading')});
  }
  function wake(group, eager = true) {
    track(group);
    // Restore picture sources before their fallback images.
    for (const item of group.media) {
      if (group.parked && item.saved) for (const [name,value] of item.saved) item.node.setAttribute(name,value);
      if (item.node.tagName === 'IMG') {
        if (eager) item.node.loading = 'eager';
        else if (item.loading === null) item.node.removeAttribute('loading');
        else item.node.setAttribute('loading',item.loading);
      }
    }
    group.parked = false;
    delete group.element.dataset.resources;
  }
  function park(group) {
    if (group.parked) return;
    track(group);
    group.element.dataset.resources = 'parked';
    for (const item of group.media) {
      const {node} = item;
      item.saved = ['src','srcset','href'].filter(name=>node.hasAttribute(name)).map(name=>[name,node.getAttribute(name)]);
      node.removeAttribute('srcset');
      if (node.tagName === 'IMG') node.setAttribute('src',empty);
      else if (node.tagName.toLowerCase() === 'image') node.setAttribute('href',empty);
    }
    group.parked = true;
  }
  function windowAt(index, force = false) {
    if (index === current && !force) return;
    current = index;
    if (!enabled) return;
    groups.forEach((group,i)=> Math.abs(i-index)<=1 ? wake(group) : park(group));
  }
  function mode(cinematic) {
    enabled = cinematic;
    if (enabled) windowAt(Math.max(0,current), true);
    else groups.forEach(group=>wake(group,false)); // Native reading/reduced-motion layout stays complete.
  }
  window.garbaSceneResources = Object.freeze({windowAt, mode});
})();
