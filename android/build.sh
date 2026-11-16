#!/usr/bin/env bash
# Builds the Film Wheel Android app (a thin full-screen wrapper round the live site) without Gradle.
#
#   ANDROID_SDK=/path/to/sdk  ROOM=<invite code, optional>  KEYSTORE=<file, optional>  android/build.sh out.apk
#
# Needs a JDK and an Android SDK with platforms;android-35 and build-tools;35.0.0.
# ROOM bakes the owner's private invite code into the app so it opens straight onto their wheel.
# Never commit an APK built with ROOM, or the keystore.
set -euo pipefail
cd "$(dirname "$0")"
OUT="${1:?usage: build.sh out.apk}"; case "$OUT" in /*) ;; *) OUT="$OLDPWD/$OUT";; esac
SDK="${ANDROID_SDK:?set ANDROID_SDK}"; BT="$SDK/build-tools/35.0.0"; JAR="$SDK/platforms/android-35/android.jar"
HOST="film-wheel-100.web.app"; URL="https://$HOST/"; [ -n "${ROOM:-}" ] && URL="https://$HOST/?room=$ROOM"
W="$(mktemp -d)"; trap 'rm -rf "$W"' EXIT
mkdir -p "$W/gen/app/filmwheel" "$W/classes" "$W/dex"
cat > "$W/gen/app/filmwheel/Config.java" <<JAVA
package app.filmwheel;
final class Config { static final String HOST = "$HOST"; static final String START_URL = "$URL"; }
JAVA
"$BT/aapt2" compile --dir res -o "$W/res.zip"
"$BT/aapt2" link -I "$JAR" --manifest AndroidManifest.xml --java "$W/gen" -o "$W/base.apk" "$W/res.zip"
javac -nowarn -source 17 -target 17 -classpath "$JAR" -d "$W/classes" $(find src "$W/gen" -name '*.java') 2>&1 | grep -v "^Picked up\|bootstrap class path\|^1 warning" || true
"$BT/d8" --release --min-api 30 --lib "$JAR" --output "$W/dex" $(find "$W/classes" -name '*.class')
(cd "$W/dex" && zip -q -j "$W/base.apk" classes.dex)
"$BT/zipalign" -f 4 "$W/base.apk" "$W/aligned.apk"
KS="${KEYSTORE:-$W/debug.keystore}"
[ -f "$KS" ] || keytool -genkeypair -keystore "$KS" -storepass filmwheel -keypass filmwheel -alias filmwheel -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Film Wheel" >/dev/null 2>&1
"$BT/apksigner" sign --ks "$KS" --ks-pass pass:filmwheel --key-pass pass:filmwheel --out "$OUT" "$W/aligned.apk"
"$BT/apksigner" verify "$OUT" && echo "built $OUT"
