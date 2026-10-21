"""Polices (Inter, hébergées sur le site, sous-ensemble latin en woff2), aperçus des démos et image de partage.
Nécessite Pillow, fonttools, brotli et Chromium (Playwright) ; ne sert qu'à régénérer assets/ : le site, lui, est statique.
  python3 tools/build-assets.py fonts   |  thumbs <dossier glsc.fr servi sur />  |  og"""
import os, subprocess, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
FONTS = os.path.join(ROOT, "assets/fonts")
SRC = "/usr/share/fonts/opentype/inter"
UNICODES = "U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+2013-2014,U+2018-201A,U+201C-201E,U+2022,U+2026,U+20AC,U+2190-2193,U+2197,U+2713,U+00D7"

def fonts():
    for src, out in (("Inter-Regular", "inter-400"), ("Inter-Medium", "inter-500"), ("Inter-SemiBold", "inter-600"),
                     ("InterDisplay-SemiBold", "inter-display-600"), ("InterDisplay-Bold", "inter-display-700")):
        subprocess.run(["pyftsubset", f"{SRC}/{src}.otf", f"--unicodes={UNICODES}", "--flavor=woff2", "--layout-features=kern,liga,calt,ccmp,locl,mark,mkmk,tnum,case,ss01,cv11",
                        f"--output-file={FONTS}/{out}.woff2"], check=True)
        print(out, os.path.getsize(f"{FONTS}/{out}.woff2"))


def thumbs():
    """Vignettes 960×600 (webp) des trois réalisations, à partir de captures 1440×900 déjà faites dans le dossier donné en argument."""
    from PIL import Image
    src = sys.argv[2]
    for name in ("club", "btp", "hub"):
        im = Image.open(f"{src}/{name}.png").convert("RGB").resize((960, 600), Image.LANCZOS)
        im.save(os.path.join(ROOT, f"assets/img/{name}.webp"), "WEBP", quality=82, method=6)
        print(name, os.path.getsize(os.path.join(ROOT, f"assets/img/{name}.webp")))

ACCENT, INK, BG = (36, 71, 214), (11, 18, 32), (246, 247, 249)

def brand():
    """Favicon (SVG + PNG) et image de partage 1200×630."""
    from PIL import Image, ImageDraw, ImageFont
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    from fontTools.pens.boundsPen import BoundsPen
    # Icône : « G » (Inter Display Bold) blanc sur carré arrondi bleu, dessiné en tracé vectoriel.
    f = TTFont(f"{SRC}/InterDisplay-Bold.otf"); gs = f.getGlyphSet(); g = f.getBestCmap()[ord("G")]
    b = BoundsPen(gs); gs[g].draw(b); x0, y0, x1, y1 = b.bounds
    k = 34 / (y1 - y0); tx = 32 - (x0 + x1) / 2 * k; ty = 32 + (y0 + y1) / 2 * k
    pen = SVGPathPen(gs); gs[g].draw(TransformPen(pen, (k, 0, 0, -k, tx, ty)))
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#2447D6"/><path d="{pen.getCommands()}" fill="#fff"/></svg>\n'
    open(os.path.join(ROOT, "assets/favicon.svg"), "w").write(svg)
    for size, name, bleed in ((32, "favicon-32.png", False), (180, "apple-touch-icon.png", True)):
        S = 4; n = size * S; im = Image.new("RGBA", (n, n), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        d.rounded_rectangle((0, 0, n, n), 0 if bleed else int(n * .25), fill=ACCENT + (255,))
        fnt = ImageFont.truetype(f"{SRC}/InterDisplay-Bold.otf", int(n * .58)); tb = d.textbbox((0, 0), "G", font=fnt)
        d.text((n / 2 - (tb[0] + tb[2]) / 2, n / 2 - (tb[1] + tb[3]) / 2), "G", font=fnt, fill=(255, 255, 255, 255))
        out = im.resize((size, size), Image.LANCZOS)
        (out.convert("RGB") if bleed else out).save(os.path.join(ROOT, "assets", name))
    # Image de partage
    W, H = 1200, 630; im = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(im)
    for x in range(0, W, 40): d.line((x, 0, x, H), fill=(232, 235, 241))
    for y in range(0, H, 40): d.line((0, y, W, y), fill=(232, 235, 241))
    d.rectangle((0, 0, W, 8), fill=ACCENT)
    F = lambda n, s: ImageFont.truetype(f"{SRC}/{n}.otf", s)
    d.rounded_rectangle((72, 72, 120, 120), 12, fill=ACCENT); d.text((96, 96), "G", font=F("InterDisplay-Bold", 32), fill="white", anchor="mm")
    d.text((136, 96), "StudioGLSC", font=F("InterDisplay-Bold", 32), fill=INK, anchor="lm")
    d.text((72, 190), "Un site web", font=F("InterDisplay-Bold", 104), fill=INK)
    d.text((72, 300), "à votre image.", font=F("InterDisplay-Bold", 104), fill=ACCENT)
    d.text((72, 440), "Sites vitrines rapides et adaptés au mobile, en Bretagne.", font=F("Inter-Medium", 30), fill=(90, 100, 120))
    x = 72
    for t in ("Première version sous 48 h", "One-Page Express · 400 €", "Sans abonnement obligatoire"):
        fnt = F("Inter-SemiBold", 22); w = d.textlength(t, font=fnt) + 36
        d.rounded_rectangle((x, 510, x + w, 562), 26, fill="white", outline=(214, 220, 230), width=2)
        d.text((x + 18, 536), t, font=fnt, fill=INK, anchor="lm"); x += w + 12
    im.save(os.path.join(ROOT, "assets/img/og.png"), optimize=True)
    print("favicon + og")

if __name__ == "__main__":
    {"fonts": fonts, "thumbs": thumbs, "brand": brand}[sys.argv[1]]()
