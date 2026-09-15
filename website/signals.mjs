// Sampling conventions match the first two cells of code_generator.ipynb.
export function sineWave(amplitude = 1, frequency = 1, phase = 0) {
  return Array.from({ length: 500 }, (_, i) => {
    const t = 2 * i / 499;
    return [t, amplitude * Math.sin(2 * Math.PI * frequency * t + phase)];
  });
}

export function timeSignal(amplitude, frequency) {
  return Array.from({ length: 1000 }, (_, i) => {
    const t = i / 1000;
    return [t, amplitude * Math.sin(2 * Math.PI * frequency * t)];
  });
}

// DFT bins 0..25 are exactly the visible bins of np.fft.fft at fs=1000.
// Cache the basis so moving a slider only requires multiply-and-add operations.
const basis = Array.from({ length: 26 }, (_, k) =>
  Array.from({ length: 1000 }, (_, n) => {
    const angle = 2 * Math.PI * k * n / 1000;
    return [Math.cos(angle), -Math.sin(angle)];
  }));

export function spectrum(samples) {
  if (samples.length !== 1000) throw new Error('Spectrum requires 1000 samples');
  return basis.map((bin, k) => {
    let real = 0;
    let imaginary = 0;
    for (let n = 0; n < samples.length; n++) {
      real += samples[n][1] * bin[n][0];
      imaginary += samples[n][1] * bin[n][1];
    }
    return [k, Math.hypot(real, imaginary)];
  });
}
