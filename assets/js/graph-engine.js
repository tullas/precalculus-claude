/**
 * GraphEngine — minimal, dependency-free canvas coordinate + plotting layer.
 * Every unit's lab.js is built on this so nobody re-derives pixel<->math
 * coordinate conversion six times. See docs/curriculum-blueprint.md §4 for
 * the public API contract.
 */
const GraphEngine = (() => {

  function mount(canvas, opts = {}) {
    const ctx = canvas.getContext("2d");
    const config = {
      xRange: opts.xRange || [-10, 10],
      yRange: opts.yRange || [-10, 10],
      grid: opts.grid !== false,
      axisLabels: opts.axisLabels !== false,
      bg: opts.bg || "#0c0f22",
      axisColor: opts.axisColor || "rgba(243,238,225,0.5)",
      gridColor: opts.gridColor || "rgba(243,238,225,0.08)",
    };

    function dpr() { return window.devicePixelRatio || 1; }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const ratio = dpr();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    }

    function toPixel(x, y) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const [x0, x1] = config.xRange, [y0, y1] = config.yRange;
      return [
        ((x - x0) / (x1 - x0)) * w,
        h - ((y - y0) / (y1 - y0)) * h,
      ];
    }

    function toMath(px, py) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const [x0, x1] = config.xRange, [y0, y1] = config.yRange;
      return [
        x0 + (px / w) * (x1 - x0),
        y0 + ((h - py) / h) * (y1 - y0),
      ];
    }

    let queue = [];

    function drawBase() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.fillStyle = config.bg;
      ctx.fillRect(0, 0, w, h);

      if (config.grid) {
        ctx.strokeStyle = config.gridColor;
        ctx.lineWidth = 1;
        const [x0, x1] = config.xRange, [y0, y1] = config.yRange;
        for (let gx = Math.ceil(x0); gx <= x1; gx++) {
          const [px] = toPixel(gx, 0);
          ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
        }
        for (let gy = Math.ceil(y0); gy <= y1; gy++) {
          const [, py] = toPixel(0, gy);
          ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
        }
      }

      // axes
      ctx.strokeStyle = config.axisColor;
      ctx.lineWidth = 1.5;
      const [ox, oy] = toPixel(0, 0);
      ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();

      if (config.axisLabels) {
        ctx.fillStyle = config.axisColor;
        ctx.font = "11px JetBrains Mono, monospace";
        const [x0, x1] = config.xRange, [y0, y1] = config.yRange;
        for (let gx = Math.ceil(x0); gx <= x1; gx += Math.max(1, Math.round((x1 - x0) / 10))) {
          if (gx === 0) continue;
          const [px] = toPixel(gx, 0);
          ctx.fillText(String(gx), px + 2, oy - 4);
        }
        for (let gy = Math.ceil(y0); gy <= y1; gy += Math.max(1, Math.round((y1 - y0) / 10))) {
          if (gy === 0) continue;
          const [, py] = toPixel(0, gy);
          ctx.fillText(String(gy), ox + 4, py - 2);
        }
      }
    }

    function draw() {
      drawBase();
      for (const item of queue) item();
    }

    const scene = {
      clear() { queue = []; draw(); },

      plotFunction(fn, opts = {}) {
        queue.push(() => {
          const w = canvas.clientWidth;
          ctx.strokeStyle = opts.color || "#e8912d";
          ctx.lineWidth = opts.lineWidth || 2.5;
          ctx.beginPath();
          let started = false;
          let lastPy = null;
          for (let px = 0; px <= w; px++) {
            const [x] = toMath(px, 0);
            let y;
            try { y = fn(x); } catch (e) { y = NaN; }
            if (y === undefined || Number.isNaN(y) || !Number.isFinite(y)) {
              started = false;
              continue;
            }
            const [, py] = toPixel(x, y);
            // break the line across huge jumps (asymptotes) instead of drawing a vertical streak
            if (lastPy !== null && Math.abs(py - lastPy) > canvas.clientHeight * 0.9) {
              started = false;
            }
            if (!started) { ctx.moveTo(px, py); started = true; }
            else { ctx.lineTo(px, py); }
            lastPy = py;
          }
          ctx.stroke();
        });
        draw();
      },

      plotPoint(x, y, opts = {}) {
        queue.push(() => {
          const [px, py] = toPixel(x, y);
          ctx.fillStyle = opts.color || "#35c4b8";
          ctx.beginPath();
          ctx.arc(px, py, opts.radius || 5, 0, Math.PI * 2);
          if (opts.open) {
            ctx.fillStyle = config.bg;
            ctx.fill();
            ctx.strokeStyle = opts.color || "#35c4b8";
            ctx.lineWidth = 2;
            ctx.stroke();
          } else {
            ctx.fill();
          }
          if (opts.label) {
            ctx.fillStyle = opts.color || "#35c4b8";
            ctx.font = "12px JetBrains Mono, monospace";
            ctx.fillText(opts.label, px + 8, py - 8);
          }
        });
        draw();
      },

      plotVector(x1, y1, x2, y2, opts = {}) {
        queue.push(() => {
          const [px1, py1] = toPixel(x1, y1);
          const [px2, py2] = toPixel(x2, y2);
          ctx.strokeStyle = opts.color || "#d9636b";
          ctx.fillStyle = opts.color || "#d9636b";
          ctx.lineWidth = opts.lineWidth || 2.5;
          ctx.beginPath();
          ctx.moveTo(px1, py1);
          ctx.lineTo(px2, py2);
          ctx.stroke();
          const angle = Math.atan2(py2 - py1, px2 - px1);
          const headLen = 10;
          ctx.beginPath();
          ctx.moveTo(px2, py2);
          ctx.lineTo(px2 - headLen * Math.cos(angle - Math.PI / 6), py2 - headLen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(px2 - headLen * Math.cos(angle + Math.PI / 6), py2 - headLen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
        });
        draw();
      },

      setRange(xRange, yRange) {
        config.xRange = xRange;
        config.yRange = yRange;
        draw();
      },

      toPixel, toMath,
    };

    window.addEventListener("resize", resize);
    resize();
    return scene;
  }

  return { mount };
})();
