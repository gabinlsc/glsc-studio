#!/usr/bin/env bash
# Déploie studio.glsc.fr depuis GitHub (à lancer en root sur le serveur).
#   curl -fsSL https://raw.githubusercontent.com/gabinlsc/glsc-studio/main/deploy.sh | sudo bash            # branche main
#   curl -fsSL https://raw.githubusercontent.com/gabinlsc/glsc-studio/main/deploy.sh | sudo bash -s -- feature/refonte-ui
# Variables : GLSC_STUDIO_ROOT (dossier du site, sinon lu dans nginx), GLSC_SRC (copie locale du dépôt, pour tester).
# Sauvegarde l'existant dans /var/backups/glsc (5 dernières), n'efface rien d'autre dans le dossier du site,
# vérifie que le site répond et remet l'ancienne version si ce n'est pas le cas.
set -euo pipefail
REF="${1:-main}"
DOMAIN=studio.glsc.fr
REPO=gabinlsc/glsc-studio
BACKUPS=/var/backups/glsc
FILES=(index.html 404.html legal.css cgu.html cgv.html mentions-legales.html club-demo.html btp-demo.html robots.txt sitemap.xml)
DIRS=(a-propos blog creation-site-web demos marque sites-pour suivi)   # pages générées (tools/build-site.mjs)

c() { printf '\033[%sm%s\033[0m\n' "$1" "$2"; }
info() { c 36 "▸ $*"; }
ok() { c 32 "  ✓ $*"; }
die() { c 31 "  ✗ $*"; exit 1; }
[ "$(id -u)" = 0 ] || die "À lancer en root (sudo)."

# ---- dossier du site
ROOT="${GLSC_STUDIO_ROOT:-}"
if [ -z "$ROOT" ] && command -v nginx >/dev/null; then
  ROOT="$(nginx -T 2>/dev/null | awk -v d="$DOMAIN" '/^[[:space:]]*server[[:space:]]*\{/ {r=""; hit=0} /server_name/ && index($0,d) {hit=1} /^[[:space:]]*root[[:space:]]/ {gsub(/[;]/,"",$2); r=$2} hit && r!="" {print r; exit}')"
fi
ROOT="${ROOT:-/var/www/$DOMAIN}"
[ -d "$ROOT" ] || { info "Dossier $ROOT créé"; mkdir -p "$ROOT"; }
if [ -n "${GLSC_SRC:-}" ]; then info "Site : $ROOT · version : copie locale"; else info "Site : $ROOT · version : $REF"; fi

# ---- téléchargement
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
if [ -n "${GLSC_SRC:-}" ]; then SRC="$GLSC_SRC"
else
  curl -fsSL "https://codeload.github.com/$REPO/tar.gz/$REF" | tar -xz -C "$WORK"
  SRC="$(find "$WORK" -mindepth 1 -maxdepth 1 -type d | head -1)"
fi
for f in "${FILES[@]}" assets/studio.css assets/studio.js assets/home.js assets/fonts/inter-400.woff2 assets/favicon.svg assets/theme-init.js assets/notfound.css assets/legal.js assets/suivi.js assets/fx.js assets/fx.css assets/brand.css assets/brand.js assets/brand/studioglsc-kit-de-marque.zip assets/video/studioglsc-complet-h.mp4 marque/index.html suivi/index.html demos/index.html demos/shared/demo.css demos/shared/demo.js demos/restaurant/index.html demos/fonts/fraunces.woff2; do
  [ -s "$SRC/$f" ] || die "Archive incomplète : $f manquant. Rien n'a été modifié."
done
ok "archive complète"

# ---- sauvegarde
install -d -m 700 "$BACKUPS"
BK="$BACKUPS/studio-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BK" -C "$ROOT" . 2>/dev/null || true
ok "sauvegarde : $BK"
ls -1t "$BACKUPS"/studio-*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f

# ---- installation
OWNER="$(stat -c '%u:%g' "$ROOT")"
rollback() { c 31 "  ↩ retour à la version précédente"; rm -rf "$ROOT/assets" "${DIRS[@]/#/$ROOT/}"; tar -xzf "$BK" -C "$ROOT"; exit 1; }
rm -rf "$ROOT/assets.new"; cp -r "$SRC/assets" "$ROOT/assets.new"
find "$ROOT/assets.new" -type d -exec chmod 755 {} + ; find "$ROOT/assets.new" -type f -exec chmod 644 {} +
for f in "${FILES[@]}"; do install -m 644 "$SRC/$f" "$ROOT/$f.new" && mv -f "$ROOT/$f.new" "$ROOT/$f"; done
[ -s "$ROOT/assets/img/gabin.jpg" ] && { mkdir -p "$ROOT/assets.new/img"; cp -p "$ROOT/assets/img/gabin.jpg" "$ROOT/assets.new/img/gabin.jpg"; }   # photo déposée sur le serveur, hors dépôt
rm -rf "$ROOT/assets.old"; [ -d "$ROOT/assets" ] && mv "$ROOT/assets" "$ROOT/assets.old"; mv "$ROOT/assets.new" "$ROOT/assets"; rm -rf "$ROOT/assets.old"
for d in "${DIRS[@]}"; do
  [ -d "$SRC/$d" ] || continue
  rm -rf "$ROOT/$d.new" "$ROOT/$d.old"; cp -r "$SRC/$d" "$ROOT/$d.new"
  find "$ROOT/$d.new" -type d -exec chmod 755 {} + ; find "$ROOT/$d.new" -type f -exec chmod 644 {} +
  [ -d "$ROOT/$d" ] && mv "$ROOT/$d" "$ROOT/$d.old"; mv "$ROOT/$d.new" "$ROOT/$d"; rm -rf "$ROOT/$d.old"
done
chown -R "$OWNER" "$ROOT" 2>/dev/null || true
ok "fichiers en place"

# ---- vérification
if [ -z "${GLSC_SRC:-}" ] && command -v curl >/dev/null; then
  for path in / /assets/studio.css /assets/home.js /assets/fonts/inter-400.woff2 /mentions-legales.html /blog/ /a-propos/ /demos/ /marque/ /suivi/; do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://$DOMAIN$path" || echo 000)"
    [ "$code" = 200 ] && ok "$path → 200" || { c 31 "  ✗ $path → $code"; rollback; }
  done
fi
# ---- en-têtes de sécurité (fichier installé, mais jamais inclus automatiquement dans nginx)
if [ -s "$SRC/deploy/studio-security.conf" ] && [ -d /etc/nginx/snippets ]; then
  install -m 644 "$SRC/deploy/studio-security.conf" /etc/nginx/snippets/studio-security.conf
  if nginx -T 2>/dev/null | grep -q "include[[:space:]]*snippets/studio-security.conf"; then
    ok "en-têtes de sécurité : snippet à jour et déjà inclus dans nginx"
  else
    c 33 "  ! en-têtes de sécurité : snippet installé mais pas encore actif. Dans le bloc server de $DOMAIN, ajouter :"
    c 33 "      include snippets/studio-security.conf;     puis : nginx -t && systemctl reload nginx"
  fi
fi
c 32 "Terminé : https://$DOMAIN/ (Ctrl+F5 pour contourner le cache du navigateur)"
