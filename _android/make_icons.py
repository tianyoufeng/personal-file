# -*- coding: utf-8 -*-
# 从网页图标生成安卓各密度启动图标
from PIL import Image
import os

SRC = r"D:\Before_file\WorkBuddy_File\家庭档案-app\v1.0\app\icons\icon-512.png"
RES = r"D:\Before_file\WorkBuddy_File\家庭档案-app\v1.0\_android\res"

DENS = {"mipmap-mdpi": 48, "mipmap-hdpi": 72, "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144, "mipmap-xxxhdpi": 192}

img = Image.open(SRC).convert("RGBA")
for d, size in DENS.items():
    p = os.path.join(RES, d)
    os.makedirs(p, exist_ok=True)
    img.resize((size, size), Image.LANCZOS).save(os.path.join(p, "ic_launcher.png"))
print("android icons ok")
