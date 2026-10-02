# -*- coding: utf-8 -*-
# 生成应用图标：琥珀棕圆角底 + 白色档案夹人形
from PIL import Image, ImageDraw
import os

OUT = r"D:\Before_file\WorkBuddy_File\家庭档案-app\v1.0\app\icons"
os.makedirs(OUT, exist_ok=True)

def make_icon(size):
    s = 512
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # 背景圆角方块（全出血，maskable 安全）
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=(168, 91, 42, 255))

    # 白色档案夹主体
    d.rounded_rectangle([96, 150, 416, 400], radius=28, fill=(255, 255, 255, 255))
    # 夹子标签
    d.rounded_rectangle([96, 112, 250, 170], radius=22, fill=(255, 255, 255, 255))

    # 档案夹内的人形（琥珀色）
    cx = 256
    d.ellipse([cx - 44, 190, cx + 44, 278], fill=(168, 91, 42, 255))
    d.pieslice([cx - 76, 282, cx + 76, 430], 180, 360, fill=(168, 91, 42, 255))

    # 底部两条浅棕线（档案层叠感）
    d.rounded_rectangle([130, 366, 382, 384], radius=9, fill=(243, 228, 215, 255))

    out = img.resize((size, size), Image.LANCZOS)
    return out

make_icon(512).save(os.path.join(OUT, "icon-512.png"))
make_icon(192).save(os.path.join(OUT, "icon-192.png"))
print("icons ok")
