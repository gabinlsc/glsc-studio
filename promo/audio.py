#!/usr/bin/env python3
"""Bande-son du film (synthèse pure, numpy) : nappes, basse, arpèges, whooshs aux changements de scène, clic, cloche finale.
   Aucun échantillon externe, aucune musique sous licence. Sortie : promo/audio/bande-son.wav (44,1 kHz stéréo)."""
import os, sys, numpy as np, wave
SHORT = 'short' in sys.argv[1:]  # version courte (~14,5 s)
SR = 44100; DUR = 14.5 if SHORT else 47.0; N = int(SR * DUR)
rng = np.random.default_rng(7)
t = np.arange(N) / SR
CUTS = [2.2, 4.1, 6.3, 8.2, 10.1] if SHORT else [4.2, 10.4, 18.6, 23.6, 30.4, 36.6, 40.3]
T_PULSE, T_ARP, T_END, T_CLICK, BELLS = (2.0, 2.4, 13.4, 10.05, (10.9, 10.95, 11.8, 12.5)) if SHORT else (4.0, 10.7, 37.0, 39.55, (40.95, 41.0, 42.35, 43.45))
L = np.zeros(N); R = np.zeros(N)

def hz(note):  # note MIDI -> Hz
    return 440.0 * 2 ** ((note - 69) / 12)
def env(n, a, r, hold=None):
    e = np.ones(n); na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] = np.minimum(e[-nr:], np.linspace(1, 0, nr) ** 2); return e
def add(sig, start, gl=1.0, gr=1.0):
    i = int(start * SR); j = min(N, i + len(sig))
    if i >= N: return
    L[i:j] += sig[:j - i] * gl; R[i:j] += sig[:j - i] * gr
def lp(x, fc):  # filtre passe-bas simple (un pôle)
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for k in range(len(x)): s = (1 - a) * x[k] + a * s; y[k] = s
    return y

# --- nappes : Am – F – C – G, un changement d'accord à chaque coupe
CH = [[45, 52, 57, 60], [41, 48, 57, 60], [48, 55, 60, 64], [43, 50, 59, 62], [45, 52, 57, 64], [41, 53, 57, 65], [48, 55, 64, 67], [45, 57, 64, 69]]
starts = [0.0] + CUTS
for ci, s0 in enumerate(starts):
    s1 = starts[ci + 1] if ci + 1 < len(starts) else DUR; d = s1 - s0 + 1.6; n = int(d * SR); tt = np.arange(n) / SR
    for k, note in enumerate(CH[ci]):
        f = hz(note); sig = np.zeros(n)
        for det, pan in ((-0.0035, 0.0), (0.0035, 1.0)):
            ff = f * (1 + det); v = sum(np.sin(2 * np.pi * ff * h * tt + k + h) / h ** 1.35 for h in range(1, 7))
            v *= env(n, 1.4, 1.6) * (0.5 + 0.5 * np.sin(2 * np.pi * (0.08 + 0.01 * k) * tt + k))
            add(v * 0.055, s0, 1 - 0.35 * pan, 0.65 + 0.35 * pan)
# --- basse et pulsation à partir de la scène B
bpm = 80; beat = 60 / bpm
for k in range(int((DUR - T_PULSE) / beat)):
    tb = T_PULSE + k * beat
    if tb > DUR - 1.5: break
    n = int(0.42 * SR); tt = np.arange(n) / SR; f = 95 * np.exp(-tt * 9) + 42
    kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7.5) * 0.55
    add(kick, tb, 0.9, 0.9)
# note grave tenue
for ci, s0 in enumerate(starts):
    s1 = starts[ci + 1] if ci + 1 < len(starts) else DUR; d = s1 - s0 + 1.0; n = int(d * SR); tt = np.arange(n) / SR
    add(np.sin(2 * np.pi * hz(CH[ci][0] - 12) * tt) * env(n, .8, 1.0) * 0.17, s0)
# --- arpèges (scènes C à F) avec écho
def pluck(f, dur=1.1):
    n = int(dur * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt * 6) + 0.15 * np.sin(2 * np.pi * 3 * f * tt) * np.exp(-tt * 9)) * np.exp(-tt * 4.2) * np.minimum(1, tt * 400)
step = beat / 2
k = 0; tb = T_ARP
while tb < T_END:
    ci = min(max(i for i, s in enumerate(starts) if s <= tb), len(CH) - 1); notes = CH[ci][1:] + [CH[ci][1] + 12, CH[ci][2] + 12]
    note = notes[[0, 2, 1, 3, 2, 4, 1, 3][k % 8]] + 12; amp = 0.075 if k % 4 else 0.10
    pan = 0.5 + 0.4 * np.sin(k * 0.9); add(pluck(hz(note)) * amp, tb, 1 - pan * 0.6, 0.4 + pan * 0.6)
    tb += step; k += 1
# --- bruits : « whooshs » avant chaque coupe + impacts graves
def whoosh(dur, up=True):
    n = int(dur * SR); x = rng.normal(0, 1, n); tt = np.linspace(0, 1, n)
    fc = (300 * (1 - tt) + 5200 * tt) if up else (5200 * (1 - tt) + 300 * tt)
    out = np.zeros(n); y = 0.0
    for i in range(0, n, 512):  # filtre à fréquence variable, par blocs
        a = np.exp(-2 * np.pi * fc[min(i, n - 1)] / SR); seg = x[i:i + 512]
        for j in range(len(seg)): y = (1 - a) * seg[j] + a * y; out[i + j] = y
    return out / (np.abs(out).max() + 1e-9) * np.sin(np.pi * tt) ** 1.5
for c in CUTS:
    w = whoosh(0.95, True); add(w * 0.16, c - 0.85, 0.9, 1.0)
    n = int(1.6 * SR); tt = np.arange(n) / SR
    boom = np.sin(2 * np.pi * 52 * tt * np.exp(-tt * .25)) * np.exp(-tt * 2.6) * 0.5 + rng.normal(0, 1, n) * np.exp(-tt * 26) * 0.10
    add(boom, c - 0.02)
# --- clic de la souris (scène G) puis cloche du logo
cl = int(0.08 * SR); tt = np.arange(cl) / SR; add((np.sin(2 * np.pi * 2400 * tt) + 0.6 * rng.normal(0, 1, cl)) * np.exp(-tt * 70) * 0.14, T_CLICK)
def bell(f, dur=4.5):
    n = int(dur * SR); tt = np.arange(n) / SR; v = 0
    for r, a, d in ((1, 1.0, 1.1), (2.01, .5, 1.6), (2.76, .33, 2.2), (4.07, .22, 3.0), (5.4, .12, 4.0)): v = v + np.sin(2 * np.pi * f * r * tt) * a * np.exp(-tt * d)
    return v * np.minimum(1, tt * 300)
add(bell(hz(81)) * 0.07, BELLS[0], 1.0, 0.8); add(bell(hz(76)) * 0.05, BELLS[1], 0.8, 1.0); add(bell(hz(88)) * 0.05, BELLS[2], 0.9, 1.0); add(bell(hz(93)) * 0.04, BELLS[3], 0.9, 1.0)
# --- réverbération (réponse impulsionnelle synthétique, légèrement différente à gauche et à droite)
def ir(seed, sec=2.6):
    r = np.random.default_rng(seed); n = int(sec * SR); tt = np.arange(n) / SR; x = r.normal(0, 1, n) * np.exp(-tt * 2.1)
    return lp(x, 4200) * 0.6
def reverb(x, seed):
    h = ir(seed); n = len(x) + len(h) - 1; m = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(h, m), m)[:len(x)]; return y / np.abs(y).max()
wetL, wetR = reverb(L, 1), reverb(R, 2)
pk = max(np.abs(L).max(), np.abs(R).max()); L2 = L / pk + wetL * 0.30; R2 = R / pk + wetR * 0.30
# --- fondus d'entrée et de sortie, normalisation
g = np.minimum(1, t / 1.2) * np.minimum(1, (DUR - t) / 1.6); L2 *= g; R2 *= g
pk = max(np.abs(L2).max(), np.abs(R2).max()); L2 = L2 / pk * 0.89; R2 = R2 / pk * 0.89
os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio"), exist_ok=True)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio/bande-son-courte.wav" if SHORT else "audio/bande-son.wav")
pcm = (np.stack([L2, R2], 1) * 32767).astype("<i2")
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(out, os.path.getsize(out) // 1024, "Ko")
