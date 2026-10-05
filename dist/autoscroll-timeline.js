/* Seconds from opt-in to the document end. Cursor 14 ends the story; 15 ends the page. */
(() => {
  "use strict";
  const segments = [
    ["opening", 3.5], ["beginning", 5], ["the-invitation", 11],
    ["the-plan", 2.5], ["the-drive", 1.5], ["arrival", 8],
    ["a-memory", 4.5], ["devotion", 1.5], ["the-stage", 3.5],
    ["celebration", 1.5], ["partner-road", 20], ["finale", 1.5],
  ];
  // Door and descent each gain one second. The extra boarding second is
  // spent on the actual climb (cursor 3.25–3.47), not the approach or exit.
  // Keep moving through the clear gate and a full extra second of the interior.
  const points = [
    [0, 0], [1 + 1.5 * 1.9 / 4.7, 1], [3.5, 1.42],
    [6, 1.60], [8.2, 1.70], [8.5, 2],
    [10, 2.18], [13.5, 2.38], [15, 2.56], [18.5, 2.70], [19.5, 3],
    [19.875, 3.25], [21.205, 3.47], [22, 4], [23.5, 5],
    [25.1, 5.38], [26.2, 5.60], [27.9, 5.74], [29.7, 5.90], [30.7, 5.96], [31.5, 6],
    [33.2, 6.24], [35.1, 6.54], [36, 7], [37.5, 8],
    [40.3, 8.70], [41, 9], [42.5, 10], [62.5, 14], [64, 15],
  ];
  function cursorAt(seconds) {
    if (seconds <= 0) return 0;
    for (let i = 1; i < points.length; i++) {
      const [end, to] = points[i], [start, from] = points[i - 1];
      if (seconds <= end) return from + (to - from) * (seconds - start) / (end - start);
    }
    return 15;
  }
  // Manual seeking maps back to time. Pausing saves the exact elapsed position.
  function timeAt(cursor) {
    if (cursor <= 0) return 0;
    for (let i = 1; i < points.length; i++) {
      const [end, to] = points[i], [start, from] = points[i - 1];
      if (cursor <= to) return to === from ? start : start + (end - start) * (cursor - from) / (to - from);
    }
    return 64;
  }
  window.garbaTimeline = Object.freeze({
    duration: 64, openingDuration: 3.5,
    segments: Object.freeze(segments.map(Object.freeze)), cursorAt, timeAt,
  });
})();
