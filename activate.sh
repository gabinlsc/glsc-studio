#!/usr/bin/env bash
# Active tout StudioGLSC d'un coup (à lancer en root sur le VPS, APRÈS avoir mergé les PR) :
#   curl -fsSL https://raw.githubusercontent.com/gabinlsc/glsc-studio/main/activate.sh | sudo bash
# Étapes : 1) service + admin (deploy4 du portfolio)  2) site studio.glsc.fr (deploy.sh)
#          3) include nginx ajouté tout seul dans le bloc HTTPS de studio.glsc.fr, test, reload (retour arrière si nginx refuse)
#          4) vérifications de bout en bout.
# Relançable à volonté.
set -euo pipefail
DOMAIN=studio.glsc.fr
c() { printf '\033[%sm%s\033[0m\n' "$1" "$2"; }
info() { c 36 "▸ $*"; }; ok() { c 32 "  ✓ $*"; }; warn() { c 33 "  ! $*"; }; die() { c 31 "  ✗ $*"; exit 1; }
[ "$(id -u)" = 0 ] || die "À lancer en root (sudo)."

info "1/4 Service StudioGLSC, admin et collecteur (deploy4)"
curl -fsSL https://raw.githubusercontent.com/gabinlsc/portfolio/main/deploy/deploy4.sh | bash

info "2/4 Site $DOMAIN"
curl -fsSL https://raw.githubusercontent.com/gabinlsc/glsc-studio/main/deploy.sh | bash

info "2b/4 Photo (cv.glsc.fr)"
ROOT="$(nginx -T 2>/dev/null | awk -v d="$DOMAIN" '/^[[:space:]]*server[[:space:]]*\{/ {r=""; hit=0} /server_name/ && index($0,d) {hit=1} /^[[:space:]]*root[[:space:]]/ {gsub(/[;]/,"",$2); r=$2} hit && r!="" {print r; exit}')"
ROOT="${ROOT:-/var/www/$DOMAIN}"
if [ -s "$ROOT/assets/img/gabin.jpg" ]; then ok "photo déjà en place"
else
  T="$(mktemp)"
  if curl -fsSL -m 30 -o "$T" https://cv.glsc.fr/photocv.jpg && [ "$(head -c3 "$T" | xxd -p)" = ffd8ff ] && [ "$(stat -c%s "$T")" -lt 3000000 ]; then
    install -d -m 755 "$ROOT/assets/img"; install -m 644 "$T" "$ROOT/assets/img/gabin.jpg"; ok "photo installée"
  else warn "photo introuvable sur cv.glsc.fr/photocv.jpg (ou pas un JPEG < 3 Mo) : monogramme conservé. Dépose-la en $ROOT/assets/img/gabin.jpg"; fi
  rm -f "$T"
fi

info "3/4 nginx"
[ -s /etc/nginx/snippets/studio-security.conf ] || die "snippet absent : deploy.sh ne l'a pas installé."
if nginx -T 2>/dev/null | grep -q "include[[:space:]]*snippets/studio-security.conf"; then
  ok "include déjà présent"
else
  # nginx -T liste chaque fichier chargé (« # configuration file … ») : on prend celui qui déclare le domaine (grep -r ne suit pas les liens symboliques de sites-enabled).
  CONF="$(nginx -T 2>/dev/null | awk -v d="$DOMAIN" '/^# configuration file /{f=$4; sub(/:$/,"",f)} /^[[:space:]]*server_name/ && index($0,d) && f!="" {print f; exit}')"
  [ -n "$CONF" ] || CONF="$(grep -Rls "server_name[^;]*$DOMAIN" /etc/nginx 2>/dev/null | head -1 || true)"
  [ -n "$CONF" ] || die "aucune conf nginx pour $DOMAIN (nginx -T | grep -n server_name pour voir ce qui existe)."
  CONF="$(readlink -f "$CONF")"
  cp -a "$CONF" "$CONF.bak-$(date +%s)"
  python3 - "$CONF" "$DOMAIN" <<'PY' || die "bloc HTTPS de $DOMAIN introuvable dans $CONF (ajoutez l'include à la main)."
import re, sys
path, dom = sys.argv[1:3]
s = open(path, encoding='utf-8').read()
# repère les blocs "server { ... }" (accolades équilibrées) et choisit celui en HTTPS de ce domaine
done = False
pos = 0
while True:
    m = re.compile(r'\n?[ \t]*server\s*\{').search(s, pos)
    if not m: break
    depth, j = 1, m.end()
    while depth and j < len(s):
        depth += {'{': 1, '}': -1}.get(s[j], 0); j += 1
    block = s[m.start():j]
    if not done and dom in block and re.search(r'listen\s+[^;]*443', block) and 'return 301' not in block.split('location')[0][-200:]:
        k = re.search(r'server_name[^;]*;', block)
        ins = block[:k.end()] + '\n    include snippets/studio-security.conf;' + block[k.end():]
        s = s[:m.start()] + ins + s[j:]; done = True; break
    pos = j
if not done:
    sys.exit(1)
open(path, 'w', encoding='utf-8').write(s)
PY
  ok "include ajouté dans $CONF"
fi
if nginx -t 2>/dev/null; then systemctl reload nginx && ok "nginx rechargé"
else
  nginx -t || true
  if [ -n "${CONF:-}" ]; then cp -a "$(ls -t "$CONF".bak-* | head -1)" "$CONF"; warn "conf remise comme avant"; fi
  die "nginx refuse la configuration (conflit avec un bloc existant ?). Rien n'a été rechargé."
fi

info "4/4 Vérifications"
code() { curl -s -o /dev/null -w '%{http_code}' "$@" || true; }
[ "$(code https://$DOMAIN/)" = 200 ] && ok "accueil 200" || warn "accueil ne répond pas 200"
[ "$(code https://$DOMAIN/suivi/)" = 200 ] && ok "/suivi/ 200" || warn "/suivi/ ne répond pas 200"
r="$(curl -s -X POST https://$DOMAIN/api/project -H 'Content-Type: application/json' -d '{"token":"00000000000000000000000000000000"}' -w ' %{http_code}' || true)"
case "$r" in *" 404") ok "API joignable via nginx (jeton inconnu → 404, attendu)";; *) warn "API : réponse inattendue ($r). Voir : docker logs glsc-games-studio-1";; esac
H="$(curl -sI https://$DOMAIN/ || true)"
echo "$H" | grep -qi "content-security-policy" && ok "en-têtes de sécurité actifs" || warn "en-têtes de sécurité absents"
ok "Terminé. Reste à faire de ton côté : REPLY_DELAY / BOOKING_URL dans assets/studio.js, photo, Google Business Profile."
