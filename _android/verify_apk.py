# -*- coding: utf-8 -*-
# APK 包内容逐字节核对：assets 与源文件一致、dex 在根目录、dex 头部合法
import zipfile, zlib, sys

APK = r"D:\Before_file\WorkBuddy_File\家庭档案-app\v1.0\dist\家庭档案-v1.0.0.apk"
APP = r"D:\Before_file\WorkBuddy_File\家庭档案-app\v1.0\app"
BUILD = r"C:\Users\q2764\.workbuddy\binaries\android-build\work\familyarchive"

z = zipfile.ZipFile(APK)
names = z.namelist()
fail = 0
def bad(m):
    global fail; fail = 1; print("FAIL:", m)

for f in ["assets/index.html", "assets/style.css", "assets/app.js",
          "assets/manifest.json", "assets/sw.js", "assets/icons/icon-192.png",
          "assets/icons/icon-512.png"]:
    if f not in names: bad("missing in apk: " + f)
for n in ["ic_launcher.png"]:
    if not any(x.endswith("mipmap-mdpi-v4/" + n) for x in names): bad("missing icon: " + n)
    if not any(x.endswith("mipmap-xxxhdpi-v4/" + n) for x in names): bad("missing icon xxxhdpi: " + n)

pairs = [
    ("assets/index.html", APP + r"\index.html"),
    ("assets/style.css", APP + r"\style.css"),
    ("assets/app.js", APP + r"\app.js"),
    ("assets/manifest.json", APP + r"\manifest.json"),
]
for inside, src in pairs:
    if z.read(inside) != open(src, "rb").read(): bad("byte mismatch: " + inside)
    else: print("byte-equal:", inside)

if "classes.dex" not in names: bad("classes.dex not at root")
else:
    d = z.read("classes.dex")
    print("dex size:", len(d))
    if d[:4] != b"dex\n": bad("dex magic")
    if d[4:7] not in (b"035", b"037", b"038", b"039"): bad("dex version tag: " + repr(d[4:7]))
    import struct
    fsize = struct.unpack("<I", d[32:36])[0]
    if fsize != len(d): bad("dex file_size %d != actual %d" % (fsize, len(d)))
    if struct.unpack("<I", d[36:40])[0] != 112: bad("dex header_size != 112")
    if struct.unpack("<I", d[40:44])[0] != 0x12345678: bad("dex endian_tag")
    adler = zlib.adler32(d[12:]) & 0xFFFFFFFF
    if struct.unpack("<I", d[8:12])[0] != adler: bad("dex adler32 mismatch")
    # 中文串按 UTF-8 字节查（正则会漏中文）
    if "家庭档案".encode("utf-8") not in d: bad("dex missing app string")
    if b"saveFile" not in d: bad("dex missing saveFile")
    print("dex header + strings OK")

print("APK VERIFY " + ("FAILED" if fail else "OK"))
sys.exit(fail)
