# -*- coding: utf-8 -*-
# 把 classes.dex 合入 base.apk 根目录，保留原条目的压缩方式与顺序
import sys, zipfile, os

src, dst, dex = sys.argv[1], sys.argv[2], sys.argv[3]
zin = zipfile.ZipFile(src, 'r')
zout = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED)
for item in zin.infolist():
    data = zin.read(item.filename)
    zi = zipfile.ZipInfo(item.filename, date_time=item.date_time)
    zi.compress_type = item.compress_type
    zi.external_attr = item.external_attr
    zout.writestr(zi, data, compress_type=item.compress_type)
zout.write(dex, 'classes.dex')
zout.close()
zin.close()
print('merged dex ok')
