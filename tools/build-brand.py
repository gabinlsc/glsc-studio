#!/usr/bin/env python3
"""Kit de marque StudioGLSC : logos en SVG (le logotype est dessiné en courbes à partir d'Inter Display 700, aucune police requise)
   et archive .zip. Les PNG sont produits par tools/build-brand.mjs (Chromium).
   python3 tools/build-brand.py svg | zip"""
import os, sys, zipfile, glob
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "assets/brand")
BLUE, BLUE_DEEP, INK, WHITE = "#2447D6", "#1B37B0", "#0B1220", "#FFFFFF"

# Le « G » du monogramme (grille 64 × 64), identique à assets/favicon.svg
G = open(os.path.join(ROOT, "assets/favicon.svg"), encoding="utf-8").read().split('<path d="')[1].split('"')[0]
GB = (16.0, 14.5, 48.0, 49.5)  # boîte du G, pour la version sans carré

font = TTFont(os.path.join(ROOT, "assets/fonts/inter-display-700.woff2"))
GS, CMAP = font.getGlyphSet(), font.getBestCmap()
def text_path(text, size, x0, baseline, tracking=-0.022):
    k, x, parts = size / 2048, x0, []
    for ch in text:
        g = GS[CMAP[ord(ch)]]; pen = SVGPathPen(GS, ntos=lambda v: ("%.2f" % v).rstrip("0").rstrip("."))
        g.draw(TransformPen(pen, (k, 0, 0, -k, x, baseline))); parts.append(pen.getCommands()); x += g.width * k + tracking * size
    return " ".join(parts), x - tracking * size

def svg(w, h, body, vb=None, title="StudioGLSC"):
    vb = vb or f"0 0 {w} {h}"
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{h}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'

def mark(bg, fg, rx=16): return f'<rect width="64" height="64" rx="{rx}" fill="{bg}"/><path d="{G}" fill="{fg}"/>'

def lockup(bg, fg, studio, glsc, size=34):
    base = 32 + size * 0.727 / 2
    a, x = text_path("Studio", size, 82, base); b, x2 = text_path("GLSC", size, x - 0.022 * size * 0 + 0, base)
    w = round(x2 + 2, 1)
    return svg(w, 64, mark(bg, fg) + f'<path d="{a}" fill="{studio}"/><path d="{b}" fill="{glsc}"/>'), w

FILES = {}
FILES["studioglsc-monogramme.svg"] = svg(64, 64, mark(BLUE, WHITE))
FILES["studioglsc-monogramme-blanc.svg"] = svg(64, 64, mark(WHITE, BLUE))
FILES["studioglsc-monogramme-noir.svg"] = svg(64, 64, mark(INK, WHITE))
FILES["studioglsc-lettre-bleu.svg"] = svg(32, 35, f'<path d="{G}" fill="{BLUE}"/>', vb="16 14.5 32 35")
FILES["studioglsc-lettre-blanc.svg"] = svg(32, 35, f'<path d="{G}" fill="{WHITE}"/>', vb="16 14.5 32 35")
FILES["studioglsc-lettre-noir.svg"], _ = svg(32, 35, f'<path d="{G}" fill="{INK}"/>', vb="16 14.5 32 35"), 0
FILES["studioglsc-logo.svg"], W = lockup(BLUE, WHITE, INK, BLUE)
FILES["studioglsc-logo-fond-sombre.svg"], _ = lockup(BLUE, WHITE, WHITE, BLUE)
FILES["studioglsc-logo-noir.svg"], _ = lockup(INK, WHITE, INK, INK)
FILES["studioglsc-logo-blanc.svg"], _ = lockup(WHITE, INK, WHITE, WHITE)

def build_svg():
    os.makedirs(OUT, exist_ok=True)
    for n, c in FILES.items():
        open(os.path.join(OUT, n), "w", encoding="utf-8").write(c); print(n)
    # largeur du logo (pour la mise en page des PNG)
    open(os.path.join(OUT, ".logo-width"), "w").write(str(W))

README = """StudioGLSC — kit de marque
===========================

Contenu
- svg/   logos vectoriels (monogramme, lettre G seule, logo horizontal) en couleur, fond sombre, noir et blanc
- png/   les mêmes en PNG (monogramme 1024/512/180, logo 2400 px de large, avatar réseaux sociaux, bannière, image de partage)
- couleurs.css   variables CSS de la palette

Règles essentielles
- Le monogramme est un carré arrondi bleu #2447D6 avec un G blanc. Ne le redessinez pas, ne le déformez pas, ne changez pas ses couleurs.
- Zone de protection : laissez autour du logo un espace au moins égal à la moitié de la hauteur du monogramme.
- Taille minimale : 24 px à l'écran (monogramme), 8 mm à l'impression ; 120 px de large pour le logo horizontal.
- Sur fond clair, utilisez le logo couleur ; sur fond sombre, la version « fond sombre » ; en une seule couleur, la version noire ou blanche.
- Polices : Inter Display 700 (titres) et Inter 400/500/600 (textes), licence SIL OFL.

Contact : pro@glsc.fr — https://studio.glsc.fr/marque/
"""
COLORS_CSS = """/* StudioGLSC — palette de marque */
:root {
  --glsc-blue: #2447D6;        /* bleu StudioGLSC (couleur principale) */
  --glsc-blue-deep: #1B37B0;   /* bleu profond (survol, états actifs) */
  --glsc-blue-soft: #E9EEFE;   /* bleu très pâle (fonds, pastilles) */
  --glsc-night: #0A0F1C;       /* nuit (fond du thème sombre) */
  --glsc-ink: #0B1220;         /* encre (texte, fonds sombres) */
  --glsc-muted: #566074;       /* gris texte secondaire */
  --glsc-line: #E1E5ED;        /* filets */
  --glsc-bg: #F6F7F9;          /* fond de page */
  --glsc-surface: #FFFFFF;     /* cartes */
  --glsc-ok: #107A57;          /* confirmation */
}
"""

def build_zip():
    dst = os.path.join(OUT, "studioglsc-kit-de-marque.zip")
    if os.path.exists(dst): os.remove(dst)
    with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        z.writestr("LISEZMOI.txt", README); z.writestr("couleurs.css", COLORS_CSS)
        for f in sorted(glob.glob(os.path.join(OUT, "*.svg"))): z.write(f, "svg/" + os.path.basename(f))
        for f in sorted(glob.glob(os.path.join(OUT, "*.png"))): z.write(f, "png/" + os.path.basename(f))
        og = os.path.join(ROOT, "assets/img/og.png")
        if os.path.exists(og): z.write(og, "png/studioglsc-partage-1200x630.png")
    print("zip", os.path.getsize(dst) // 1024, "Ko")

if __name__ == "__main__":
    (build_svg if sys.argv[1:] == ["svg"] else build_zip)()
