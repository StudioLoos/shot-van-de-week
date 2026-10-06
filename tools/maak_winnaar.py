"""Shot van de Week – winnaarsafbeelding in de goedgekeurde huisstijl.

Gebruik:
  python3 maak_winnaar.py <bronfoto> <weeknr> "<wedstrijd>" "<fotograaf>" <uit.jpg> [--hoogte 1440|1350]
3:4 = 1080x1440 (website, standaard) ; 4:5 = 1080x1350 (social feed)
"""
import argparse, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HIER = os.path.dirname(os.path.abspath(__file__))
FB = lambda s: ImageFont.truetype(os.path.join(HIER, 'Fredoka-Bold.ttf'), s)
MS = lambda s: ImageFont.truetype(os.path.join(HIER, 'Montserrat-SemiBold.ttf'), s)
MM = lambda s: ImageFont.truetype(os.path.join(HIER, 'Montserrat-Medium.ttf'), s)
C1, C2 = np.array([0xE9, 0x4E, 0x1B]), np.array([0xF9, 0xB2, 0x33])
GEEL = (0xF9, 0xB2, 0x33)


def grad(w, h, diag=False):
    x = np.linspace(0, 1, w)[None, :, None]
    t = (x + np.linspace(0, 1, h)[:, None, None]) / 2 if diag else np.repeat(x, h, axis=0)
    return Image.fromarray((C1 * (1 - t) + C2 * t).astype('uint8'))


def maak(bron, week, wedstrijd, fotograaf, uit, H=1440):
    W, BAR = 1080, 140
    src = Image.open(bron).convert('RGB')
    s = max(W / src.width, H / src.height)
    r = src.resize((round(src.width * s), round(src.height * s)), Image.LANCZOS)
    l, t = (r.width - W) // 2, (r.height - H) // 2
    r = r.crop((l, t, l + W, t + H)).filter(ImageFilter.GaussianBlur(40))
    bg = Image.fromarray(np.clip(np.array(r).astype(float) * 0.47 + [6, 16, 55], 0, 255).astype('uint8')).convert('RGBA')

    # foto met witte rand, gecentreerd tussen titel en balk
    bar_top, title_bottom = H - BAR, 154
    iw = 960; ih = round(iw * src.height / src.width)
    maxh = bar_top - title_bottom - 120
    if ih > maxh: ih = maxh; iw = round(ih * src.width / src.height)
    bw = 6
    frame = Image.new('RGB', (iw + 2 * bw, ih + 2 * bw), 'white')
    frame.paste(src.resize((iw, ih), Image.LANCZOS), (bw, bw))
    fx = (W - frame.width) // 2
    fy = round((title_bottom + bar_top) / 2 - frame.height / 2)
    bg.paste(frame, (fx, fy))

    # watermerk
    wm = Image.new('RGBA', (2400, 2400), (0, 0, 0, 0)); d = ImageDraw.Draw(wm)
    line = 'eredivisiebadminton.nl  •  #ShotVanDeWeek  •  ' * 8
    for i, y in enumerate(range(0, 2400, 130)):
        d.text((-((i * 190) % 600), y), line, font=MS(30), fill=(255, 255, 255, 46))
    wm = wm.rotate(22, resample=Image.BICUBIC, center=(1200, 1200)).crop((660, 525, 660 + W, 525 + H))
    bg = Image.alpha_composite(bg, wm)
    d = ImageDraw.Draw(bg)

    # badge
    cx, cy, R = 92, 100, 62
    g = grad(2 * R, 2 * R, diag=True).convert('RGBA')
    m = Image.new('L', (8 * R, 8 * R), 0); ImageDraw.Draw(m).ellipse((0, 0, 8 * R - 1, 8 * R - 1), fill=255)
    ring = Image.new('L', (8 * R + 48, 8 * R + 48), 0); ImageDraw.Draw(ring).ellipse((0, 0, 8 * R + 47, 8 * R + 47), fill=255)
    bg.paste((255, 255, 255, 255), (cx - R - 6, cy - R - 6), ring.resize((2 * R + 12, 2 * R + 12), Image.LANCZOS))
    bg.paste(g, (cx - R, cy - R), m.resize((2 * R, 2 * R), Image.LANCZOS))
    d.text((cx, cy - 26), 'WEEK', font=FB(20), fill='white', anchor='mm')
    d.text((cx, cy + 14), str(week), font=FB(72 if len(str(week)) == 1 else 58), fill='white', anchor='mm')

    # titels
    d.text((590, 115), 'WINNAAR', font=FB(70), fill=GEEL, anchor='ms')
    d.text((590, 154), 'SHOT VAN DE WEEK', font=FB(32), fill='white', anchor='ms')

    # onderbalk
    bg.paste(grad(W, BAR).convert('RGBA'), (0, bar_top))
    icoon = Image.open(os.path.join(HIER, 'shuttle_mask.png')).convert('L')
    ih2 = 86
    ic = icoon.resize((round(icoon.width * ih2 / icoon.height), ih2), Image.LANCZOS)
    bg.paste((255, 255, 255, 255), (36, bar_top + (BAR - ih2) // 2), ic)
    d.text((128, bar_top + 62), '#SHOTVANDEWEEK', font=FB(38), fill='white', anchor='ls')
    d.text((128, bar_top + 104), wedstrijd, font=MM(22), fill='white', anchor='ls')
    d.text((W - 30, bar_top + 102), f'Foto © {fotograaf}', font=MS(19), fill='white', anchor='rs')
    bg.convert('RGB').save(uit, quality=92)


if __name__ == '__main__':
    a = argparse.ArgumentParser()
    a.add_argument('bron'); a.add_argument('week'); a.add_argument('wedstrijd'); a.add_argument('fotograaf'); a.add_argument('uit')
    a.add_argument('--hoogte', type=int, default=1440)
    x = a.parse_args()
    maak(x.bron, x.week, x.wedstrijd, x.fotograaf, x.uit, x.hoogte)
