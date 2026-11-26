"""Build design/tema-perbandingan.svg: same 4 screens across all themes, one row per theme."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import themes

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SCREENS = ["02a-login", "03-dashboard", "04-add-transaction", "07-budget", "05-transactions"]
LABELS = ["Masuk", "Beranda", "Catat transaksi", "Anggaran", "Transaksi"]
W, H, GX, GY, LEFT, TOP = 390, 844, 40, 150, 380, 220
ORDER = ["hutan", "samudra", "terakota", "anggrek", "malam", "citrus"]

def load(key, name):
    path = os.path.join(ROOT, name + ".svg") if key == "hutan" else os.path.join(ROOT, "themes", key, name + ".svg")
    s = open(path, encoding="utf-8").read()
    s = re.sub(r'id="([\w-]+)"', lambda m: f'id="{m.group(1)}-{key}"', s)
    s = re.sub(r'url\(#([\w-]+)\)', lambda m: f'url(#{m.group(1)}-{key})', s)
    s = s.replace("<style>", "<!--").replace("</style>", "-->")
    return s

bw = LEFT + len(SCREENS) * (W + GX) + 20
bh = TOP + len(ORDER) * (H + GY)
fonts = "|".join(themes.get(k)["FONT_URL"] for k in ORDER if k)
out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{bw}" height="{bh}" viewBox="0 0 {bw} {bh}" '
       f'font-family="\'Plus Jakarta Sans\',system-ui,sans-serif">',
       f"<style>@import url('https://fonts.googleapis.com/css2?family={'&amp;family='.join(sorted(set(fonts.split('|'))))}&amp;display=swap');</style>",
       f'<rect width="{bw}" height="{bh}" fill="#ECEAE4"/>',
       '<text x="60" y="90" font-size="46" font-weight="800" fill="#15201C" letter-spacing="-1">Vynance — 6 Tema Warna</text>',
       '<text x="60" y="128" font-size="18" font-weight="500" fill="#5C6863">Layout sama, token warna &amp; huruf berbeda. Baris pertama = tema awal.</text>']
for r, key in enumerate(ORDER):
    t = themes.get(key)
    y = TOP + r * (H + GY)
    out.append(f'<rect x="20" y="{y - 30}" width="{bw - 40}" height="{H + 70}" rx="36" fill="{t["BOARD"]}"/>')
    out.append(f'<text x="60" y="{y + 50}" font-size="15" font-weight="700" fill="{t["FAINT"]}" letter-spacing="1.5">TEMA {r + 1}{" · AWAL" if key == "hutan" else ""}</text>')
    out.append(f'<text x="60" y="{y + 100}" font-size="48" font-weight="800" fill="{t["INK"] if key != "malam" else "#E8F0EC"}" letter-spacing="-1" style="font-family:{t["FONT"]}">{t["NAME"]}</text>')
    words, line, ly = t["DESC"].split(), "", y + 140
    for wd in words:
        if len(line + wd) > 30:
            out.append(f'<text x="60" y="{ly}" font-size="17" font-weight="500" fill="{t["MUTED"]}">{line.strip()}</text>'); line, ly = "", ly + 26
        line += wd + " "
    out.append(f'<text x="60" y="{ly}" font-size="17" font-weight="500" fill="{t["MUTED"]}">{line.strip()}</text>')
    sw = [t["PRI"], t["HERO2"], t["PRI_S"], t["GOLD"], t["BG"], t["INK"], t["INC"], t["EXP"], t["TRF"], t["INV"]]
    for i, c in enumerate(sw):
        cx, cy = 60 + (i % 5) * 54, ly + 50 + (i // 5) * 54
        out.append(f'<rect x="{cx}" y="{cy}" width="44" height="44" rx="12" fill="{c}" stroke="#00000022"/>')
    out.append(f'<text x="60" y="{ly + 180}" font-size="14" font-weight="600" fill="{t["MUTED"]}">Huruf: {t["FONT"].split(",")[0].strip(chr(39))}</text>')
    for i, name in enumerate(SCREENS):
        x = LEFT + i * (W + GX)
        svg = load(key, name)
        svg = svg.replace("<svg ", f'<svg x="{x}" y="{y}" ', 1)
        out.append(f'<rect x="{x}" y="{y}" width="{W}" height="{H}" rx="44" fill="#000" opacity=".10" transform="translate(0 10)"/>')
        out.append(svg)
        if r == 0:
            out.append(f'<text x="{x}" y="{y - 46}" font-size="16" font-weight="700" fill="#5C6863">{LABELS[i]}</text>')
out.append("</svg>")
open(os.path.join(ROOT, "tema-perbandingan.svg"), "w", encoding="utf-8").write("".join(out))
print("ok", bw, bh)
