#!/bin/bash
# 家庭档案 App v1.0.0 — APK 构建脚本（无 Gradle，五步手工链路）
set -e
export PATH="/c/Windows/System32:/usr/bin:/bin:$PATH"

BASEW="C:/Users/q2764/.workbuddy/binaries/android-build"
JDK="$BASEW/jdk/bin"
BT="$BASEW/sdk/build-tools/34.0.0"
PLATFORM="$BASEW/sdk/platforms/android-34/android.jar"
export JAVA_HOME='C:\Users\q2764\.workbuddy\binaries\android-build\jdk'

PROJ="D:/Before_file/WorkBuddy_File/家庭档案-app/v1.0"
APP="$PROJ/app"
BUILD="$BASEW/work/familyarchive"
KS="$BASEW/keys/familyarchive.keystore"
KS_ALIAS="familyarchive"
KS_PASS="family-archive-2026"
OUT="$PROJ/dist/家庭档案-v1.0.0.apk"

# 断言工具存在
for t in "$BT/aapt2.exe" "$BT/d8.bat" "$BT/zipalign.exe" "$BT/apksigner.bat" \
         "$JDK/javac.exe" "$JDK/jar.exe" "$JDK/keytool.exe" "$PLATFORM"; do
  [ -f "$t" ] || { echo "MISSING: $t"; exit 1; }
done

rm -rf "$BUILD"
mkdir -p "$BUILD"/assets/icons "$BUILD"/gen "$BUILD"/classes "$BUILD"/dex
mkdir -p "$PROJ/dist"

# 0) aapt2/javac 不吃中文路径：把工程拷到 ASCII 路径再构建
AND="$BUILD/_android"
cp -r "$PROJ/_android" "$AND"
chmod -R u+w "$AND"

# 1) assets：网页本体 + PWA 资源
cp "$APP/index.html" "$APP/style.css" "$APP/app.js" "$APP/manifest.json" "$APP/sw.js" "$BUILD/assets/"
cp "$APP"/icons/icon-*.png "$BUILD/assets/icons/"

# 1.5) 安卓各密度图标（缺则生成）
if [ ! -f "$AND/res/mipmap-xxxhdpi/ic_launcher.png" ]; then
  PY="C:/Users/q2764/.workbuddy/binaries/python/envs/default/Scripts/python.exe"
  [ -f "$PY" ] || PY="C:/Users/q2764/.workbuddy/binaries/python/versions/3.13.12/python.exe"
  "$PY" "$AND/make_icons.py"
fi

# 2) 编译资源
"$BT/aapt2.exe" compile --dir "$AND/res" -o "$BUILD/res.zip"

# 3) 链接：base.apk + assets + R.java
"$BT/aapt2.exe" link -o "$BUILD/base.apk" -I "$PLATFORM" \
  --manifest "$AND/AndroidManifest.xml" -A "$BUILD/assets" --java "$BUILD/gen" \
  --min-sdk-version 24 --target-sdk-version 34 \
  --version-code 1 --version-name "1.0.0" "$BUILD/res.zip"

# 4) javac
"$JDK/javac.exe" -source 8 -target 8 -nowarn -encoding UTF-8 \
  -bootclasspath "$PLATFORM" -d "$BUILD/classes" \
  "$BUILD/gen/com/local/familyarchive/R.java" \
  "$AND/java/com/local/familyarchive/MainActivity.java"

# 5) d8（先打 jar）
"$JDK/jar.exe" cf "$BUILD/classes.jar" -C "$BUILD/classes" .
"$BT/d8.bat" --release --min-api 24 --lib "$PLATFORM" --output "$BUILD/dex" "$BUILD/classes.jar"

# 6) 合入 classes.dex（保序保压缩方式）
PY="C:/Users/q2764/.workbuddy/binaries/python/envs/default/Scripts/python.exe"
[ -f "$PY" ] || PY="C:/Users/q2764/.workbuddy/binaries/python/versions/3.13.12/python.exe"
"$PY" "$AND/merge_dex.py" "$BUILD/base.apk" "$BUILD/unsigned.apk" "$BUILD/dex/classes.dex"

# 7) 密钥库（首次生成，复用）
if [ ! -f "$KS" ]; then
  "$JDK/keytool.exe" -genkeypair -keystore "$KS" -alias "$KS_ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10950 \
    -storepass "$KS_PASS" -keypass "$KS_PASS" \
    -dname "CN=Family Archive, OU=Personal, O=Local, C=CN"
fi

# 8) 对齐（签名前）
"$BT/zipalign.exe" -p -f 4 "$BUILD/unsigned.apk" "$BUILD/aligned.apk"

# 9) 签名
"$BT/apksigner.bat" sign --ks "$KS" --ks-pass "pass:$KS_PASS" --key-pass "pass:$KS_PASS" \
  --ks-key-alias "$KS_ALIAS" --v1-signing-enabled true --v2-signing-enabled true \
  --v3-signing-enabled true --v4-signing-enabled false --out "$OUT" "$BUILD/aligned.apk"
rm -f "$OUT.idsig"

echo "BUILD OK: $OUT"
