/* Motion stays on controls; native clicks, links and story scrolling are untouched. */
(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const controls = document.querySelectorAll(
    "button:not(.box-hit-area):not(.shop-open), a.outline-button, a.book-button, a.header-link, a.text-button, .event-links a, .photo-input",
  );
  const timers = new WeakMap();
  controls.forEach((control) => control.classList.add("button-motion"));

  function pulse(control, x = 50, y = 50) {
    if (
      !control ||
      reduced.matches ||
      document.documentElement.classList.contains("read-mode") ||
      control.matches(":disabled, [aria-disabled='true']") ||
      control.closest("[inert]")
    )
      return;
    control.style.setProperty("--press-x", `${Math.max(0, Math.min(100, x))}%`);
    control.style.setProperty("--press-y", `${Math.max(0, Math.min(100, y))}%`);
    clearTimeout(timers.get(control));
    control.classList.remove("button-pressed");
    // Restart the short pulse even when the visitor taps twice quickly.
    void control.offsetWidth;
    control.classList.add("button-pressed");
    timers.set(
      control,
      setTimeout(() => {
        control.classList.remove("button-pressed");
        timers.delete(control);
      }, 560),
    );
  }
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0 || !event.isPrimary) return;
      const control = event.target.closest?.(".button-motion");
      if (!control) return;
      const rect = control.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pulse(
        control,
        ((event.clientX - rect.left) / rect.width) * 100,
        ((event.clientY - rect.top) / rect.height) * 100,
      );
    },
    { passive: true },
  );
  document.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    const control = event.target.closest?.(".button-motion");
    if (
      event.key === "Enter" ||
      (event.key === " " && control?.tagName === "BUTTON")
    )
      pulse(control);
  });
})();
