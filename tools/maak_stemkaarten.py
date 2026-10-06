"""Shot van de Week – stemkaarten (4:5, 1080x1350) in vaste huisstijl.

Gebruik: python3 maak_stemkaarten.py ronde.json uitmap/
ronde.json: {"ronde": 4, "fotos": [{"bron": "pad.jpg", "wedstrijd": "...", "fotograaf": "..."}, ...]}
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HIER = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1350
ORANJE1, ORANJE2 = np.array([0xE9, 0x4E, 0x1B]), np.array([0xF9, 0xB2, 0x33])
FB = lambda s: ImageFont.truetype(os.path.join(HIER, 'Fredoka-Bold.ttf'), s)
MS = lambda s: ImageFont.truetype(os.path.join(HIER, 'Montserrat-SemiBold.ttf'), s)
MM = lambda s: ImageFont.truetype(os.path.join(HIER, 'Montserrat-Medium.ttf'), s)

BAR_H = 158
FOTO_TOP, FOTO_BOT = 300, H - BAR_H - 110   # vak voor de foto


def gradient(w, h, diag=False):
    x = np.linspace(0, 1, w)[None, :, None]
    if diag:
        y = np.linspace(0, 1, h)[:, None, None]
        t = (x + y) / 2
    else:
        t = np.repeat(x, h, axis=0)
    g = ORANJE1 * (1 - t) + ORANJE2 * t
    return Image.fromarray(g.astype('uint8'))


def watermerk():
    wm = Image.new('RGBA', (2600, 2600), (0, 0, 0, 0))
    d = ImageDraw.Draw(wm)
    f = MS(30)
    tekst = 'EREDIVISIEBADMINTON.NL  •  #SHOTVANDEWEEK  •  '
    for i, y in enumerate(range(0, 2600, 120)):
        d.text((-(i * 230) % 700 - 700, y), tekst * 10, font=f, fill=(255, 255, 255, 30))
    wm = wm.rotate(-24, resample=Image.BICUBIC)
    return wm.crop((760, 625, 760 + W, 625 + H))


def kaart(bron, nr, totaal, wedstrijd, fotograaf, wm, icoon):
    foto = Image.open(bron).convert('RGB')
    # achtergrond: geblurde, donkere versie
    s = max(W / foto.width, H / foto.height)
    bg = foto.resize((round(foto.width * s), round(foto.height * s)), Image.LANCZOS)
    l, t = (bg.width - W) // 2, (bg.height - H) // 2
    bg = bg.crop((l, t, l + W, t + H)).filter(ImageFilter.GaussianBlur(45))
    bg = Image.fromarray((np.array(bg).astype(float) * 0.28 + 8).clip(0, 255).astype('uint8')).convert('RGBA')
    bg = Image.alpha_composite(bg, wm)

    # foto in het middenvak (volledig in beeld)
    vak_h = FOTO_BOT - FOTO_TOP
    sc = min(W / foto.width, vak_h / foto.height)
    fw, fh = round(foto.width * sc), round(foto.height * sc)
    f = foto.resize((fw, fh), Image.LANCZOS)
    fx, fy = (W - fw) // 2, FOTO_TOP + (vak_h - fh) // 2
    bg.paste(f, (fx, fy))
    # watermerk ook licht over de foto
    over = wm.crop((fx, fy, fx + fw, fy + fh))
    bg.alpha_composite(over, (fx, fy))

    d = ImageDraw.Draw(bg)
    # titelblok
    d.text((W / 2 + 40, 92), 'SHOT VAN DE WEEK', font=FB(64), fill='white', anchor='ms')
    d.text((W / 2 + 40, 132), 'KIES JOUW FAVORIET', font=FB(30), fill='white', anchor='ms')
    d.text((W / 2 + 40, 166), 'JOUW STEM BEPAALT HET SHOT VAN DE WEEK', font=MS(21), fill=(255, 255, 255, 220), anchor='ms')
    # nummerbadge
    cx, cy, R = 118, 112, 66
    g = gradient(2 * R, 2 * R, diag=True).convert('RGBA')
    m = Image.new('L', (8 * R, 8 * R), 0); ImageDraw.Draw(m).ellipse((0, 0, 8 * R - 1, 8 * R - 1), fill=255)
    bg.paste(g, (cx - R, cy - R), m.resize((2 * R, 2 * R), Image.LANCZOS))
    d.text((cx, cy + 4), str(nr), font=FB(68), fill='white', anchor='mm')
    d.text((cx, cy + 46), f'/ {totaal}', font=MS(18), fill='white', anchor='mm')

    # onderbalk
    bar = gradient(W, BAR_H).convert('RGBA')
    bg.paste(bar, (0, H - BAR_H))
    ih = 92
    ic = icoon.resize((round(icoon.width * ih / icoon.height), ih), Image.LANCZOS)
    bg.paste((255, 255, 255, 255), (44, H - BAR_H + (BAR_H - ih) // 2), ic)
    d.text((150, H - BAR_H + 66), '#SHOTVANDEWEEK', font=FB(48), fill='white', anchor='ls')
    d.text((152, H - BAR_H + 112), wedstrijd.upper().replace(' VS ', ' vs '), font=MS(24), fill='white', anchor='ls')
    d.text((W - 36, H - 28), f'Foto © {fotograaf}', font=MS(22), fill='white', anchor='rs')
    return bg.convert('RGB')


def main(cfg_pad, uit):
    cfg = json.load(open(cfg_pad))
    os.makedirs(uit, exist_ok=True)
    wm = watermerk()
    icoon = Image.open(os.path.join(HIER, 'shuttle_mask.png')).convert('L')
    n = len(cfg['fotos'])
    for i, f in enumerate(cfg['fotos'], 1):
        k = kaart(f['bron'], i, n, f['wedstrijd'], f['fotograaf'], wm, icoon)
        k.save(os.path.join(uit, f'foto{i}.jpg'), quality=88, optimize=True, progressive=True)
        print('klaar', i)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
