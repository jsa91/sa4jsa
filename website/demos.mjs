import { sineWave, timeSignal, spectrum } from './signals.mjs';

const colors = ['var(--signal-1)', 'var(--signal-2)', 'var(--signal-3)', 'var(--signal-4)'];
const dashes = ['', '10 4', '3 4', '12 3 3 3'];
const format = (value) => Number(value).toLocaleString('sv-SE', { maximumFractionDigits: 2 });

function control(id, label, min, max, step, value, unit = '') {
  return `<div class="control"><label for="${id}">${label}<output for="${id}" id="${id}-value">${format(value)}${unit ? ` ${unit}` : ''}</output></label>
    <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-unit="${unit}"></div>`;
}

function graph(id, title, xLabel, yLabel, xMax, yMin, yMax, series) {
  const width = 880, height = 320;
  const left = 82, right = 24, top = 24, bottom = 56;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const x = (value) => left + value / xMax * plotWidth;
  const y = (value) => top + (yMax - value) / (yMax - yMin) * plotHeight;
  let grid = '';
  for (let i = 0; i <= 5; i++) {
    const xValue = xMax * i / 5, yValue = yMin + (yMax - yMin) * i / 5;
    grid += `<line x1="${x(xValue)}" y1="${top}" x2="${x(xValue)}" y2="${height-bottom}" class="grid-line"/>
      <text x="${x(xValue)}" y="${height-bottom+25}" text-anchor="middle">${format(xValue)}</text>
      <line x1="${left}" y1="${y(yValue)}" x2="${width-right}" y2="${y(yValue)}" class="grid-line"/>
      <text x="${left-12}" y="${y(yValue)+5}" text-anchor="end">${format(yValue)}</text>`;
  }
  const curves = series.map((points, i) => `<path class="signal-path" data-signal="${i+1}" d="${points.map(([a,b], n) => `${n ? 'L' : 'M'}${x(a).toFixed(2)},${y(b).toFixed(2)}`).join(' ')}" stroke="${colors[i]}" stroke-dasharray="${dashes[i]}"/>`).join('');
  return `<figure class="plot"><figcaption>${title}</figcaption><div class="plot-scroll" tabindex="0" role="region" aria-label="${title}">
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${id}-title ${id}-description" data-x-max="${xMax}" data-y-min="${yMin}" data-y-max="${yMax}">
    <title id="${id}-title">${title}</title><desc id="${id}-description">${series.length} signaler. ${xLabel}: 0–${format(xMax)}. ${yLabel}: ${format(yMin)}–${format(yMax)}. Värdena styrs av reglagen ovanför.</desc>
    <defs><clipPath id="${id}-clip"><rect x="${left}" y="${top-2}" width="${plotWidth}" height="${plotHeight+4}"/></clipPath></defs>
    ${grid}<line x1="${left}" y1="${y(0)}" x2="${width-right}" y2="${y(0)}" class="zero-line"/>
    <g clip-path="url(#${id}-clip)">${curves}</g>
    <text x="${left+plotWidth/2}" y="${height-6}" text-anchor="middle">${xLabel}</text>
    <text transform="translate(20 ${top+plotHeight/2}) rotate(-90)" text-anchor="middle">${yLabel}</text></svg></div></figure>`;
}

for (const section of document.querySelectorAll('[data-demo]')) {
  const isSine = section.dataset.demo === 'sine';
  const app = section.querySelector('.demo-app');
  const controls = isSine
    ? `<div class="controls-grid">${control('amplitude', 'Amplitud A', 0, 5, 0.1, 1)}${control('frequency', 'Frekvens f', 0, 10, 0.1, 1, 'Hz')}${control('phase', 'Fasförskjutning φ', -Math.PI, Math.PI, 'any', 0, 'rad')}</div>`
    : `<div class="count-control"><label for="signal-count">Antal signaler</label><select id="signal-count">${[1,2,3,4].map((n) => `<option${n === 1 ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
    <div class="signal-controls">${[1,2,3,4].map((n) => `<fieldset data-signal-controls="${n}"><legend><span class="signal-dot" style="background:${colors[n-1]}"></span>Signal ${n}</legend>${control(`amplitude-${n}`, 'Amplitud', 0, 5, 0.1, n)}${control(`frequency-${n}`, 'Frekvens', 1, 25, 0.1, n*5, 'Hz')}</fieldset>`).join('')}</div>`;
  app.innerHTML = `<form autocomplete="off">${controls}<button type="reset">Återställ</button></form><div class="plots"></div><p class="demo-note">${isSine ? 'Tidsfönster: 2 sekunder. Amplitudaxeln är fast så att du kan jämföra signalens storlek.' : 'Tidsfönster: 1 sekund, 1 000 sampel. Spektrumet visar onormaliserad magnitud, med 1 Hz mellan frekvenspunkterna. En sinus med amplitud 1 vid en hel frekvens ger en topp på 500. Båda grafernas skalor är fasta.'}</p>`;
  const form = app.querySelector('form');
  const plots = app.querySelector('.plots');
  const value = (id) => Number(form.querySelector(`#${id}`).value);

  function render() {
    for (const input of form.querySelectorAll('input')) {
      const label = `${format(input.value)}${input.dataset.unit ? ` ${input.dataset.unit}` : ''}`;
      form.querySelector(`#${input.id}-value`).value = label;
      input.setAttribute('aria-valuetext', label);
    }
    if (isSine) {
      plots.innerHTML = graph('sine', 'Sinusvåg', 'Tid (s)', 'Amplitud', 2, -5, 5, [sineWave(value('amplitude'), value('frequency'), value('phase'))]);
    } else {
      const count = value('signal-count');
      for (const fieldset of form.querySelectorAll('fieldset')) {
        fieldset.hidden = Number(fieldset.dataset.signalControls) > count;
        fieldset.disabled = fieldset.hidden;
      }
      const signals = Array.from({ length: count }, (_, i) => timeSignal(value(`amplitude-${i+1}`), value(`frequency-${i+1}`)));
      plots.innerHTML = `<ul class="legend" aria-label="Signalfärger och linjer">${signals.map((_,i) => `<li><svg width="32" height="12" aria-hidden="true"><line x1="0" y1="6" x2="32" y2="6" stroke="${colors[i]}" stroke-width="3" stroke-dasharray="${dashes[i]}"/></svg>Signal ${i+1}</li>`).join('')}</ul>`
        + graph('time', 'Signal i tidsdomänen', 'Tid (s)', 'Amplitud', 1, -5, 5, signals)
        + graph('spectrum', 'Signal i frekvensdomänen', 'Frekvens (Hz)', 'Magnitud', 25, 0, 3000, signals.map(spectrum));
    }
  }
  let pending;
  const schedule = () => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(render);
  };
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', schedule);
  form.addEventListener('reset', () => setTimeout(schedule, 0));
  // A continuous range includes ±π exactly; explicit keys give useful phase steps.
  form.querySelector('#phase')?.addEventListener('keydown', (event) => {
    const increments = { ArrowRight: 0.1, ArrowUp: 0.1, ArrowLeft: -0.1, ArrowDown: -0.1, PageUp: 0.5, PageDown: -0.5 };
    if (event.key in increments || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const input = event.target;
      input.value = event.key === 'Home' ? -Math.PI : event.key === 'End' ? Math.PI : Math.max(-Math.PI, Math.min(Math.PI, Number(input.value) + increments[event.key]));
      schedule();
    }
  });
  // Restore source defaults even if the browser restores previous form values.
  form.reset();
  render();
}
