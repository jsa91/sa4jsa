import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { sineWave, timeSignal, spectrum } from '../signals.mjs';

const sineCases = [[1,1,0], [0,4,1], [2.3,2.5,Math.PI/3], [5,10,-Math.PI], [1,0,Math.PI/2], [5,0,Math.PI]];
const domainCases = [[1,5], [2,10], [3,15], [4,20], [0,8], [2.3,7.5], [5,25], [5,1.1]];
const reference = spawnSync('python3', ['-c', `
import json, sys, numpy as np
cases = json.load(sys.stdin)
sine = []
for A, f, phi in cases['sine']:
    t = np.linspace(0, 2, 500)
    sine.append(np.column_stack((t, A*np.sin(2*np.pi*f*t+phi))).tolist())
domain = []
for A, f in cases['domain']:
    t = np.linspace(0, 1, 1000, endpoint=False)
    y = A*np.sin(2*np.pi*f*t)
    domain.append({'time': np.column_stack((t,y)).tolist(), 'spectrum': np.column_stack((np.arange(26), np.abs(np.fft.fft(y))[:26])).tolist()})
print(json.dumps({'sine':sine,'domain':domain}))
`], { input: JSON.stringify({ sine: sineCases, domain: domainCases }), encoding: 'utf8', maxBuffer: 4*1024*1024, timeout: 30000 });
assert.ifError(reference.error);
assert.equal(reference.status, 0, `NumPy reference generation failed: ${reference.stderr}`);
const expected = JSON.parse(reference.stdout);
function close(actual, target, tolerance = 1e-8) {
  assert.equal(actual.length, target.length);
  actual.forEach((point, i) => point.forEach((number, j) => {
    assert.ok(Math.abs(number-target[i][j]) < tolerance, `point ${i}, coordinate ${j}: ${number} != ${target[i][j]}`);
  }));
}

test('sine samples match NumPy for defaults, phase, fractional frequency, zero and bounds', () => {
  sineCases.forEach((args, i) => close(sineWave(...args), expected.sine[i]));
  assert.equal(sineWave().at(-1)[0], 2);
});
test('time signals and visible DFT bins match NumPy FFT, including spectral leakage', () => {
  domainCases.forEach((args, i) => {
    const samples = timeSignal(...args);
    close(samples, expected.domain[i].time);
    close(spectrum(samples), expected.domain[i].spectrum);
    assert.equal(samples.at(-1)[0], 0.999);
  });
});
test('default positive-frequency peaks preserve the notebook scaling', () => {
  [1,2,3,4].forEach((amplitude) => {
    const bins = spectrum(timeSignal(amplitude, amplitude*5));
    const peak = bins.reduce((best, point) => point[1] > best[1] ? point : best);
    assert.equal(peak[0], amplitude*5);
    assert.ok(Math.abs(peak[1]-amplitude*500) < 1e-8);
  });
});
