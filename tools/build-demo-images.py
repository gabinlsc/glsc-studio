#!/usr/bin/env python3
"""Génère les visuels des démos (paysages, mèches de cheveux, façades) sans aucune photo ni banque d'images.
   python3 tools/build-demo-images.py        → demos/<démo>/img/*.webp|svg
Pur numpy + Pillow, graine fixe : le résultat est reproductible."""
import os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
def out(*p):
    path = os.path.join(ROOT, "demos", *p); os.makedirs(os.path.dirname(path), exist_ok=True); return path
def hexc(h): h = h.lstrip("#"); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], dtype=np.float32) / 255

def noise2(h, w, rng, scale, octaves=5, persistence=0.5, aspect=1.0):
    """Bruit de valeurs fractal 2D normalisé 0..1 (octaves bicubiques)."""
    acc = np.zeros((h, w), np.float32); amp = 1.0; tot = 0.0
    for o in range(octaves):
        gh, gw = max(2, int(h / scale * (2 ** o) / aspect) + 2), max(2, int(w / scale * (2 ** o)) + 2)
        g = rng.random((gh, gw)).astype(np.float32)
        im = Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        acc += np.asarray(im, np.float32) / 255 * amp; tot += amp; amp *= persistence
    acc /= tot; return (acc - acc.min()) / (acc.max() - acc.min() + 1e-6)

def ridge(w, rng, base, amp, rough=0.55, scale=260, octaves=6):
    x = np.zeros(w, np.float32); a = 1.0; tot = 0
    for o in range(octaves):
        n = max(3, int(w / scale * 2 ** o) + 3)
        pts = rng.random(n).astype(np.float32)
        x += np.interp(np.linspace(0, n - 1, w), np.arange(n), pts) * a; tot += a; a *= rough
    x /= tot; return base + (x - x.mean()) * amp

def grade(img, grain, rng, vignette=0.18, warm=0.0):
    h, w, _ = img.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    v = 1 - vignette * (((xx / w - .5) ** 2 + (yy / h - .5) ** 2) * 2.2)
    img = img * v[..., None]
    lum = img.mean(axis=2, keepdims=True)
    img = img + rng.normal(0, grain, (h, w, 1)).astype(np.float32) * (0.6 + 0.8 * (1 - np.abs(lum - .5) * 2))
    img[..., 0] += warm * .02; img[..., 2] -= warm * .02
    return np.clip(img, 0, 1)

def save(img, name, q=78):
    Image.fromarray((img * 255).astype(np.uint8)).save(out(*name.split("/")), "WEBP", quality=q, method=6)
    print(name, os.path.getsize(out(*name.split("/"))) // 1024, "Ko")

def landscape(w, h, seed, sky, layers, sun=None, horizon=0.55, haze=0.5, clouds=0, grain=0.014, sea=None, warm=0.0, vignette=0.10):
    """Affiche en aplats : ciel dégradé, disque solaire net, crêtes superposées, mer à traits fins, grain de papier.
    sky : [haut, bas] ; layers : [(couleur, hauteur 0..1, amplitude, rugosité)] du plus lointain au plus proche ; sun : (x, y, rayon rel., couleur)."""
    rng = np.random.default_rng(seed)
    S = 2; W, H = w * S, h * S
    c = [hexc(x) for x in (sky[0], sky[-1])]
    t = np.linspace(0, 1, H, dtype=np.float32)[:, None, None] ** 1.15
    base = c[0] + (c[1] - c[0]) * t
    im = Image.fromarray((np.broadcast_to(base, (H, W, 3)) * 255).astype(np.uint8))
    d = ImageDraw.Draw(im, "RGBA")
    hz = int(horizon * H)
    if sun:
        sx, sy, sr, sc = sun; r = sr * H * .16
        col = tuple(int(v * 255) for v in hexc(sc))
        for k, a in ((3.0, 20),):   # un seul halo, à peine visible
            d.ellipse([sx * W - r * k, sy * H - r * k, sx * W + r * k, sy * H + r * k], fill=col + (a,))
        d.ellipse([sx * W - r, sy * H - r, sx * W + r, sy * H + r], fill=col + (255,))
    for i in range(clouds):
        cy = rng.uniform(.12, horizon * .8) * H; cx = rng.uniform(0, 1) * W; cw = rng.uniform(.18, .38) * W; ch = rng.uniform(.012, .022) * H
        d.rounded_rectangle([cx, cy, cx + cw, cy + ch], radius=ch / 2, fill=(255, 255, 255, 46))
    if sea:
        top, bot = [tuple(int(v * 255) for v in hexc(x)) for x in sea]
        for y in range(hz, H):
            f = (y - hz) / max(1, H - hz); d.line([(0, y), (W, y)], fill=tuple(int(top[k] + (bot[k] - top[k]) * f) for k in range(3)) + (255,))
        for _ in range(int(220 * h / 900)):
            y = hz + (rng.random() ** 1.6) * (H - hz); ln = rng.uniform(.02, .12) * W * (.4 + (y - hz) / (H - hz)); x = rng.uniform(-.05, 1) * W
            d.line([(x, y), (x + ln, y)], fill=(255, 255, 255, int(rng.uniform(14, 44))), width=max(1, int(H / 700)))
        if sun:
            sx, sy, sr, sc = sun; col = tuple(int(v * 255) for v in hexc(sc))
            for k in range(46):
                y = hz + (k / 46) ** 1.5 * (H - hz) * .9; ln = rng.uniform(.01, .045) * W * (1 + k / 22)
                x = sx * W + rng.normal(0, 10 + k * 3) - ln / 2
                d.line([(x, y), (x + ln, y)], fill=col + (int(220 - k * 3.2),), width=max(2, int(H / 520)))
    for i, (col, bh, amp, rough) in enumerate(layers):
        r = ridge(W, rng, bh * H, amp * H, rough, scale=W / (3 + i * 1.3))
        lc = tuple(int(v * 255) for v in hexc(col)); far = tuple(int(v * 255) for v in c[1])
        mix = haze * (1 - i / max(1, len(layers))) * .5
        fillc = tuple(int(lc[k] * (1 - mix) + far[k] * mix) for k in range(3))
        d.polygon([(0, H)] + [(x, float(r[x])) for x in range(0, W, 2)] + [(W - 1, H)], fill=fillc + (255,))
    im = im.resize((w, h), Image.LANCZOS)
    return grade(np.asarray(im, np.float32) / 255, grain, rng, vignette, warm)

# ---------------------------------------------------------------- photographe : huit « tirages »
def photographe():
    S = [
      ("aube-ouessant", 11, ["#2f4a68", "#c79a86", "#f0cfa6"], [("#5a6477", .66, .06, .5), ("#39465a", .74, .08, .55), ("#1f2a39", .86, .09, .6)], (.7, .55, .5, "#ffe2b8"), .56, .55),
      ("brume-monts", 23, ["#8b9aa1", "#bdc6c3", "#dfe2da"], [("#a5b0af", .55, .12, .55), ("#7d8e90", .66, .14, .55), ("#55686b", .78, .14, .6), ("#2c3b3c", .92, .12, .62)], None, .62, .8),
      ("maree-basse", 37, ["#3d5a73", "#9fb2b8", "#e6dccb"], [("#6f7a80", .6, .02, .4)], (.3, .5, .4, "#fff1d6"), .6, .4),
      ("dunes-pen-bron", 41, ["#7fa1bd", "#d6c9b0", "#f3e3c3"], [("#d9b98a", .6, .05, .45), ("#c49d68", .72, .08, .5), ("#a67c4b", .86, .1, .5)], (.2, .42, .5, "#fff3d6"), .58, .3),
      ("golfe-crepuscule", 53, ["#1d2a44", "#7d5f6e", "#e9a77e"], [("#3a3a50", .7, .07, .5), ("#1a1d2e", .84, .1, .55)], (.5, .66, .35, "#ffd2a0"), .7, .45),
      ("lande-hiver", 67, ["#5c6f82", "#a9b4b9", "#e2e1da"], [("#8a8f8a", .66, .06, .5), ("#5c5f57", .78, .09, .55), ("#30322e", .92, .08, .6)], None, .6, .6),
      ("falaise-matin", 71, ["#486a8c", "#b8c9d2", "#f1e6d2"], [("#8e9aa0", .52, .05, .5), ("#4d5f69", .68, .15, .6), ("#222d33", .9, .1, .6)], (.62, .4, .45, "#ffeccc"), .62, .4),
      ("ile-brehat", 83, ["#5e7a8d", "#bcc7c4", "#efe0c6"], [("#6f8a7b", .6, .03, .4), ("#3f5a49", .66, .04, .5)], (.4, .46, .45, "#fff0d0"), .62, .35),
    ]
    for i, (name, seed, sky, layers, sun, hz, haze) in enumerate(S):
        sea = ("#3f5d6d", "#1e3340") if name in ("aube-ouessant", "maree-basse", "golfe-crepuscule", "ile-brehat", "falaise-matin") else None
        w, h = (1400, 933) if i % 3 != 1 else (933, 1166)
        img = landscape(w, h, seed, sky, layers, sun, hz, haze, sea=sea, warm=.3)
        save(img, f"photographe/img/{name}.webp", 74)

# ---------------------------------------------------------------- gîte : mer et lumière
def gite():
    save(landscape(1920, 1100, 5, ["#4f7aa3", "#b9cbd0", "#f3e6cc"], [("#7f8f86", .575, .02, .4), ("#566b5c", .62, .05, .5)], (.68, .5, .5, "#fff0d2"), .58, .45, sea=("#4d7a8f", "#1d3b4c"), warm=.25), "gite/img/hero.webp", 76)
    save(landscape(1100, 760, 17, ["#6d8aa5", "#c7d1cf", "#f2e7d2"], [("#9aa89c", .6, .06, .5), ("#6a8070", .7, .08, .55), ("#44594a", .86, .1, .6)], (.3, .45, .5, "#fff0d0"), .6, .5, warm=.3), "gite/img/jardin.webp", 76)
    save(landscape(1100, 760, 29, ["#2e4663", "#bf8f7f", "#f0c9a0"], [("#444a5a", .7, .05, .5), ("#23283a", .86, .08, .55)], (.55, .62, .4, "#ffdcae"), .7, .45, sea=("#4a5a73", "#1c2638"), warm=.5), "gite/img/soir.webp", 76)
    save(landscape(1100, 760, 31, ["#9fb6c4", "#d9dfdb", "#f1ece0"], [("#b7c0b8", .58, .05, .5), ("#8a9a8f", .7, .08, .5)], None, .6, .7, clouds=3), "gite/img/brume.webp", 76)

# ---------------------------------------------------------------- restaurant : une ligne d'horizon, un ciel de fin de journée
def restaurant():
    save(landscape(1200, 1500, 7, ["#2f4258", "#c39a82", "#f3d3a4"], [("#314052", .8, .02, .4)], (.5, .5, .5, "#ffe3b0"), .66, .5, sea=("#40596a", "#1a2a36"), warm=.5), "restaurant/img/hero.webp", 74)

if __name__ == "__main__":
    photographe(); gite(); restaurant()
