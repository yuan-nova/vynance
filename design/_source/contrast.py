"""Ukur rasio kontras WCAG pasangan token di semua tema.

Pakai: python -I contrast.py            -> tabel markdown (dipakai di docs/THEME-CONTRAST.md)
       python -I contrast.py --check    -> exit 1 bila ada pasangan wajib yang gagal
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import themes

KEYS = ["hutan", "samudra", "terakota", "anggrek", "malam", "citrus"]

# (foreground, background, ambang, kegunaan di desain)
PAIRS = [
    ("INK", "BG", 4.5, "teks utama di latar"),
    ("INK", "SURF", 4.5, "teks utama di kartu"),
    ("MUTED", "SURF", 4.5, "teks sekunder di kartu"),
    ("MUTED", "BG", 4.5, "teks sekunder di latar"),
    ("FAINT", "SURF", 4.5, "label nav tidak aktif, meta 11 px"),
    ("ONP", "PRI", 4.5, "teks/ikon di tombol primer"),
    ("PRI", "SURF", 4.5, "link & label nav aktif"),
    ("PRI", "BG", 3.0, "ring fokus, batas kontrol aktif"),
    ("INC", "SURF", 4.5, "nominal uang masuk 14/700"),
    ("EXP", "SURF", 4.5, "nominal uang keluar 14/700"),
    ("TRF", "SURF", 4.5, "nominal transfer 14/700"),
    ("INV", "SURF", 4.5, "nominal investasi 14/700"),
    ("WARN", "SURF", 4.5, "teks peringatan"),
    ("INC", "INC_S", 4.5, "pill Aman"),
    ("EXP_D", "EXP_S", 4.5, "pill Melebihi"),
    ("TRF", "TRF_S", 4.5, "pill transfer"),
    ("INV", "INV_S", 4.5, "pill investasi"),
    ("WARN_D", "WARN_S", 4.5, "pill Pas / banner peringatan"),
    ("AUTO", "AUTO_S", 4.5, "badge Otomatis"),
    ("PRI", "PRI_S", 4.5, "chip aktif, tombol soft"),
    ("HERO_FG", "HERO1", 4.5, "teks kartu hero (ujung terang gradien)"),
    ("HERO_FG", "HERO2", 4.5, "teks kartu hero (ujung gelap gradien)"),
    ("GOLD", "HERO2", 3.0, "aksen grafis di hero"),
    ("HERO_NEG", "HERO1", 4.5, "nominal negatif di hero"),
    ("LINE", "SURF", 3.0, "batas kolom isian (non-teks)"),
]


def lum(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def ratio(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def main():
    check = "--check" in sys.argv
    fails = {k: 0 for k in KEYS}
    print("| Pasangan | Dipakai untuk | Ambang | " + " | ".join(themes.get(k)["NAME"] for k in KEYS) + " |")
    print("|---|---|---:|" + "---:|" * len(KEYS))
    for fg, bg, th, use in PAIRS:
        cells = []
        for k in KEYS:
            t = themes.get(k)
            v = ratio(t[fg], t[bg])
            ok = v >= th
            fails[k] += 0 if ok else 1
            cells.append(f"{v:.2f}".replace(".", ",") + ("" if ok else " **gagal**"))
        print(f"| `{fg}` / `{bg}` | {use} | {str(th).replace('.', ',')} | " + " | ".join(cells) + " |")
    print()
    print("| Jumlah gagal | | | " + " | ".join(str(fails[k]) for k in KEYS) + " |")
    if check and any(fails.values()):
        sys.exit(1)


if __name__ == "__main__":
    main()
