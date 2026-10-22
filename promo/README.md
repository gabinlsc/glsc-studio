# Film promotionnel StudioGLSC

Film de 47 s (1920 × 1080, 30 i/s) construit comme une page web animée, puis enregistré image par image.

- `index.html`, `promo.css`, `promo.js` : la « scène ». `promo.js` ne contient aucune animation CSS : `render(t)` place tout à l'instant `t`, donc le rendu est identique à chaque passage (déterministe).
- `capture.mjs` : prend les écrans de téléphone **réels** (site et démos) dans `promo/img/`.
- `audio.py` : bande-son de synthèse (numpy), sans échantillon ni musique sous licence.
- `render.mjs` : enregistre les images avec Chromium et assemble en MP4 avec ffmpeg.

```
CHROMIUM_PATH=… node promo/capture.mjs                 # écrans (à refaire si le site change)
python3 promo/audio.py                                  # bande-son → promo/audio/bande-son.wav
CHROMIUM_PATH=… node promo/render.mjs promo/dist/studioglsc-promo.mp4 --audio promo/audio/bande-son.wav
CHROMIUM_PATH=… node promo/render.mjs --frames 5,12.5,41 /tmp/controle   # images fixes pour vérifier
```

Pour changer un texte, un prix ou une durée : modifier `index.html` / `promo.js` (les instants des scènes sont dans l'objet `T`, les coupes de la musique dans `audio.py`). Les prix du film suivent le site : 550 €, dès 750 €, dès 950 €.
