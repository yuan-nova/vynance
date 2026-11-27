"""Vynance mobile UI generator -> SVG screens (390x844) + design system + sitemap + board."""
import os, sys
from xml.sax.saxutils import escape

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

# ---------- tokens (from themes.py) ----------
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import themes
THEME_KEY = sys.argv[2] if len(sys.argv) > 2 else "hutan"
globals().update(themes.get(THEME_KEY))
W, H = 390, 844

def e(t): return escape(str(t))

def rp(n, sign=False):
    s = f"{abs(int(round(n))):,}".replace(",", ".")
    pre = "−" if n < 0 else ("+" if sign and n > 0 else "")
    return f"{pre}Rp{s}"

def tw(text, size, weight=400):
    return len(str(text)) * size * (0.585 if weight >= 600 else 0.55)

def T(x, y, text, size=14, weight=400, fill=INK, anchor="start", op=None, ls=None, num=False):
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    o = f' opacity="{op}"' if op is not None else ""
    l = f' letter-spacing="{ls}"' if ls is not None else ""
    st = ' style="font-variant-numeric:tabular-nums"' if num else ""
    return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}"{a}{o}{l}{st}>{e(text)}</text>'

def R(x, y, w, h, r=0, fill=SURF, stroke=None, sw=1, op=None, extra=""):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    o = f' opacity="{op}"' if op is not None else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"{s}{o}{extra}/>'

def C(cx, cy, r, fill=SURF, stroke=None, sw=1, op=None):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    o = f' opacity="{op}"' if op is not None else ""
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"{s}{o}/>'

def L(x1, y1, x2, y2, stroke=LINE, sw=1, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}"{d}/>'

ICONS = {
 "home": "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
 "list": "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
 "plus": "M12 5v14M5 12h14",
 "pie": "M21 12A9 9 0 1 1 12 3v9zM15 3.5A9 9 0 0 1 20.5 9H15z",
 "grid": "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
 "eye": "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
 "bell": "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
 "wallet": "M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5M16.5 14h.01",
 "card": "M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM2 10h20M6 15h4",
 "bank": "M3 21h18M5 21V10M19 21V10M9.5 21V10M14.5 21V10M12 3 2 8h20z",
 "cash": "M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 10v4M18 10v4",
 "target": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
 "trend": "M22 7l-8.5 8.5-5-5L2 17M16 7h6v6",
 "repeat": "M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3",
 "scan": "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10",
 "spark": "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 2v4M21 4h-4",
 "chev_r": "M9 18l6-6-6-6", "chev_l": "M15 18l-6-6 6-6", "chev_d": "M6 9l6 6 6-6",
 "search": "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
 "filter": "M3 5h18M6 12h12M10 19h4",
 "in": "M17 7 7 17M17 17H7V7", "out": "M7 17 17 7M7 7h10v10",
 "transfer": "M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7",
 "cal": "M4 5h16v16H4zM4 10h16M8 3v4M16 3v4",
 "close": "M18 6 6 18M6 6l12 12", "check": "M20 6 9 17l-5-5",
 "user": "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
 "users": "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7M22 21a7 7 0 0 0-4-6.3",
 "heart": "M12 20s-7-4.4-9.3-8.8A4.9 4.9 0 0 1 12 6.2a4.9 4.9 0 0 1 9.3 5C19 15.6 12 20 12 20z",
 "school": "M22 9 12 4 2 9l10 5 10-5zM6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6",
 "doc": "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13h6M9 17h6",
 "tag": "M3 3h8l10 10-8 8L3 11zM7.5 7.5h.01",
 "sliders": "M4 6h9M17 6h3M15 4v4M4 12h3M11 12h9M9 10v4M4 18h11M19 18h1M17 16v4",
 "download": "M12 3v12M7 10l5 5 5-5M4 21h16",
 "camera": "M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
 "coins": "M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5",
 "send": "M22 2 11 13M22 2l-7 20-4-9-9-4z",
 "lock": "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
 "moon": "M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z",
 "globe": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20",
 "logout": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
 "bag": "M6 7h12l1 13H5zM9 7a3 3 0 0 1 6 0",
 "food": "M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2-3 5s1 4 3 4v9",
 "car": "M5 17h14v-5l-2-5H7l-2 5zM5 12h14M7.5 17v2.5M16.5 17v2.5",
 "zap": "M13 2 4 14h7l-1 8 9-12h-7z",
 "brief": "M3 7h18v13H3zM8 7V4h8v3M3 12h18",
 "wifi": "M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0M12 20h.01",
 "info": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
 "alert": "M12 3 2 20h20zM12 10v4M12 17h.01",
 "shield": "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z",
 "edit": "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
 "link": "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
 "img": "M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4M15.5 8.5h.01",
 "mic": "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
 "backspace": "M21 5H9l-6 7 6 7h12zM16 9l-5 6M11 9l5 6",
 "hand": "M12 20s-7-4.4-9.3-8.8A4.9 4.9 0 0 1 12 6.2a4.9 4.9 0 0 1 9.3 5C19 15.6 12 20 12 20zM9 12h6",
 "more": "M5 12h.01M12 12h.01M19 12h.01",
}

def I(name, x, y, s=24, color=INK, sw=1.8):
    k = s / 24
    return (f'<g transform="translate({x},{y}) scale({k:.4f})"><path d="{ICONS[name]}" fill="none" '
            f'stroke="{color}" stroke-width="{sw / k:.3f}" stroke-linecap="round" stroke-linejoin="round"/></g>')

def icon_tile(cx, cy, name, fg, bg, size=40, isz=20, r=None):
    r = size / 2 if r is None else r
    return R(cx - size / 2, cy - size / 2, size, size, r, bg) + I(name, cx - isz / 2, cy - isz / 2, isz, fg)

def avatar(cx, cy, letter, bg=PRI_S, fg=PRI, r=16, size=None):
    size = size or int(r * 0.85)
    return C(cx, cy, r, bg) + T(cx, cy + size * 0.36, letter, size, 700, fg, "middle")

def progress(x, y, w, pct, color, track=SURF2, h=8):
    p = max(0, min(1, pct))
    out = R(x, y, w, h, h / 2, track)
    if p > 0:
        out += R(x, y, max(h, w * p), h, h / 2, color)
    return out

def pill(x, y, text, fg, bg, size=11, h=22, anchor="start"):
    w = tw(text, size, 600) + 18
    if anchor == "end": x = x - w
    return R(x, y, w, h, h / 2, bg) + T(x + w / 2, y + h / 2 + size * 0.36, text, size, 600, fg, "middle"), w

def chip(x, y, text, active=False, h=34, size=13, icon=None):
    w = tw(text, size, 600) + 28 + (20 if icon else 0)
    bg = INK if active else SURF; fg = ON_INK if active else INK
    out = R(x, y, w, h, h / 2, bg, None if active else LINE)
    tx = x + 14
    if icon:
        out += I(icon, tx, y + h / 2 - 8, 16, fg); tx += 20
    out += T(tx, y + h / 2 + size * 0.36, text, size, 600, fg)
    return out, w

def button(x, y, w, text, kind="primary", h=52, icon=None, size=15):
    if kind == "primary": bg, fg, st = PRI, ONP, None
    elif kind == "dark": bg, fg, st = INK, ON_INK, None
    elif kind == "ghost": bg, fg, st = SURF, INK, LINE
    elif kind == "soft": bg, fg, st = PRI_S, PRI, None
    else: bg, fg, st = "none", PRI, None
    out = R(x, y, w, h, h / 2, bg, st)
    tw_ = tw(text, size, 700) + (26 if icon else 0)
    sx = x + (w - tw_) / 2
    if icon:
        out += I(icon, sx, y + h / 2 - 10, 20, fg); sx += 26
    out += T(sx, y + h / 2 + size * 0.36, text, size, 700, fg)
    return out

def status_bar(dark=False):
    c = HERO_FG if dark else INK
    out = T(32, 33, "9:41", 15, 700, c)
    for i, hh in enumerate([4, 6, 8, 10]):
        out += R(292 + i * 5, 30 - hh, 3, hh, 1, c)
    out += f'<path d="M318 25.5a8 8 0 0 1 11 0M320.5 28a4.5 4.5 0 0 1 6 0" fill="none" stroke="{c}" stroke-width="1.8" stroke-linecap="round"/>'
    out += C(323.5, 30, 1.3, c)
    out += R(336, 21, 24, 11.5, 3.5, "none", c, 1.2, op=0.5) + R(338, 23, 18, 7.5, 2, c) + R(361, 24.5, 1.8, 4.5, 1, c, op=0.5)
    return out

def home_ind(dark=False):
    return R(W / 2 - 67, 830, 134, 5, 2.5, HERO_FG if dark else INK)

def app_bar(title, back=False, right=(), sub=None, y=56):
    out = ""
    x = 20
    if back:
        out += R(16, y, 40, 40, 20, SURF, LINE) + I("chev_l", 26, y + 10, 20, INK)
        x = 68
    out += T(x, y + (17 if sub else 27), title, 22 if not back else 18, 800, INK, ls=-0.3)
    if sub:
        out += T(x, y + 37, sub, 13, 500, MUTED)
    rx = W - 16
    for name in right:
        rx -= 40
        out += R(rx, y, 40, 40, 20, SURF, LINE) + I(name, rx + 10, y + 10, 20, INK)
        rx -= 8
    return out

def bottom_nav(active):
    y = 760
    out = R(0, y, W, H - y, 0, SURF) + L(0, y, W, y, LINE)
    items = [("home", "Beranda", 39), ("list", "Transaksi", 117), (None, None, 195), ("pie", "Anggaran", 273), ("grid", "Lainnya", 351)]
    for ic, lab, cx in items:
        if ic is None:
            out += C(cx, y + 6, 31, BG) + C(cx, y + 6, 27, PRI) + I("plus", cx - 12, y - 6, 24, ONP, 2.4)
            continue
        on = lab == active
        col = PRI if on else FAINT
        if on:
            out += R(cx - 28, y + 9, 56, 30, 15, PRI_S)
        out += I(ic, cx - 11, y + 13, 22, col, 2 if on else 1.8)
        out += T(cx, y + 56, lab, 11, 700 if on else 500, col, "middle")
    return out + home_ind()

def section(y, title, action=None, x=20):
    out = T(x, y, title, 16, 800, INK, ls=-0.2)
    if action:
        out += T(W - 20, y, action, 13, 700, PRI, "end")
    return out

def tx_row(y, icon, fg, bg, title, sub, amount, acol, x=20, w=350, badge=None, who=None, right_sub=None):
    out = icon_tile(x + 20, y + 22, icon, fg, bg, 40, 19)
    out += T(x + 52, y + 18, title, 14, 700, INK)
    out += T(x + 52, y + 37, sub, 12, 500, MUTED)
    out += T(x + w, y + 18, amount, 14, 700, acol, "end", num=True)
    if right_sub:
        out += T(x + w, y + 37, right_sub, 11, 500, FAINT, "end")
    if badge:
        bx = x + 52 + tw(title, 14, 700) + 8
        p, _ = pill(bx, y + 5, badge[0], badge[1], badge[2], 10, 18)
        out += p
    if who:
        out += avatar(x + w - 9, y + 33, who, SURF2, MUTED, 9, 9) if not right_sub else ""
    return out

def toggle(x, y, on=True):
    return R(x, y, 44, 26, 13, PRI if on else SURF3) + C(x + (31 if on else 13), y + 13, 10, ONP if on else "#FFFFFF")

def ring(cx, cy, r, pct, color, track=SURF2, sw=10):
    import math
    c = 2 * math.pi * r
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{track}" stroke-width="{sw}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" '
            f'stroke-dasharray="{c * pct:.1f} {c:.1f}" transform="rotate(-90 {cx} {cy})"/>')

def donut(cx, cy, r, parts, sw=18):
    import math
    c = 2 * math.pi * r; off = 0; out = ""
    for pct, col in parts:
        out += (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{col}" stroke-width="{sw}" '
                f'stroke-dasharray="{c * pct - 2:.1f} {c:.1f}" stroke-dashoffset="{-off:.1f}" transform="rotate(-90 {cx} {cy})"/>')
        off += c * pct
    return out

DEFS = f'''<defs>
<linearGradient id="hero" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{HERO1}"/><stop offset="1" stop-color="{HERO2}"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3D58A"/><stop offset="1" stop-color="#D19A2E"/></linearGradient>
<linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{PRI}" stop-opacity=".28"/><stop offset="1" stop-color="{PRI}" stop-opacity="0"/></linearGradient>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{BG}" stop-opacity="0"/><stop offset="1" stop-color="{BG}"/></linearGradient>
<filter id="sh" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity=".08"/></filter>
<filter id="sh2" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000" flood-opacity=".18"/></filter>
<clipPath id="scr"><rect width="{W}" height="{H}" rx="44"/></clipPath>
</defs>'''

def hero_pattern(x, y, w, h):
    # subtle concentric arcs in the corner
    out = f'<g opacity=".10" fill="none" stroke="#fff" stroke-width="1.2">'
    for r in (60, 95, 130, 165):
        out += f'<circle cx="{x + w - 10}" cy="{y + 10}" r="{r}"/>'
    return out + "</g>"

# ======================================================================
# SCREENS
# ======================================================================
SCREENS = []
def screen(fname, title):
    def deco(fn):
        SCREENS.append((fname, title, fn)); return fn
    return deco

@screen("02a-login", "Masuk")
def s_login():
    o = R(0, 0, W, H, 0, HERO2) + f'<rect width="{W}" height="520" fill="url(#hero)"/>'
    o += hero_pattern(0, 0, W, 520)
    o += status_bar(True)
    # logo
    o += R(32, 96, 56, 56, 18, "#FFFFFF") + f'<path d="M45 112l15 24 15-24" fill="none" stroke="{HERO2}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' + C(60, 112, 3.5, GOLD)
    o += T(32, 200, "Vynance", 34, 800, HERO_FG, ls=-0.8)
    o += T(32, 234, "Keuangan keluarga,", 20, 600, PRI_T)
    o += T(32, 262, "satu tempat.", 20, 600, PRI_T)
    # floating cards illustration
    o += f'<g transform="rotate(-6 250 400)">' + R(150, 318, 210, 120, 22, HERO_TINT) + T(170, 350, "Kekayaan bersih", 11, 600, PRI_T) + T(170, 378, "Rp186.450.000", 20, 800, HERO_FG, num=True) + progress(170, 400, 170, .78, GOLD, HERO2, 6) + "</g>"
    o += f'<g transform="rotate(4 120 440)">' + R(36, 392, 190, 96, 20, SURF) + icon_tile(66, 424, "bag", EXP, EXP_S, 36, 17) + T(92, 420, "Indomaret", 13, 700) + T(92, 437, "Belanja Bulanan", 11, 500, MUTED) + T(206, 470, "−Rp287.500", 14, 800, EXP, "end", num=True) + "</g>"
    # bottom sheet
    o += R(0, 540, W, 320, 32, BG)
    o += T(24, 586, "Mulai kelola uang bersama", 19, 800, INK, ls=-0.3)
    o += T(24, 610, "Catat, atur anggaran, dan pantau target keluarga.", 13, 500, MUTED)
    o += R(24, 636, 342, 54, 27, SURF, LINE)
    o += C(122, 663, 11, "none") + f'<g transform="translate(110,651)"><path d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.3h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.1-2 3.4-4.9 3.4-8.4z" fill="#4285F4"/><path d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A11.5 11.5 0 0 0 12 24z" fill="#34A853"/><path d="M5.6 14.7a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4z" fill="#FBBC05"/><path d="M12 4.6c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 0 0 1.8 7.3l3.8 3C6.5 6.6 9 4.6 12 4.6z" fill="#EA4335"/></g>'
    o += T(146, 668, "Lanjut dengan Google", 15, 700)
    o += button(24, 700, 342, "Masuk dengan email", "dark")
    o += T(W / 2, 786, "Coba dulu tanpa akun", 13, 700, PRI, "middle")
    o += I("lock", 64, 801, 13, FAINT) + T(82, 811, "Data hanya terlihat oleh kamu & keluarga yang diundang", 10.5, 500, FAINT)
    return o + home_ind()

@screen("02b-onboarding", "Onboarding: saldo awal")
def s_onboard():
    o = R(0, 0, W, H, 0, BG) + status_bar()
    o += R(16, 56, 40, 40, 20, SURF, LINE) + I("chev_l", 26, 66, 20)
    for i in range(3):
        o += R(150 + i * 32, 74, 26, 5, 2.5, PRI if i <= 1 else SURF3)
    o += T(W - 20, 81, "Lewati", 13, 700, MUTED, "end")
    o += T(20, 140, "Langkah 2 dari 3", 12, 700, PRI, ls=0.4)
    o += T(20, 172, "Berapa saldo di tiap", 24, 800, ls=-0.5)
    o += T(20, 202, "rekeningmu sekarang?", 24, 800, ls=-0.5)
    o += T(20, 230, "Isi kira-kira saja. Bisa diubah kapan pun.", 14, 500, MUTED)
    rows = [("bank", PRI, PRI_S, "Bank BCA", "Bank", "28.640.000", True),
            ("bank", TRF, TRF_S, "Bank Mandiri", "Bank", "9.120.000", False),
            ("wallet", INC, INC_S, "GoPay", "E-wallet", "1.240.000", False),
            ("cash", INV, INV_S, "Dompet Tunai", "Tunai", "850.000", False),
            ("card", EXP, EXP_S, "Kartu Kredit", "Utang · limit Rp15 jt", "6.200.000", False)]
    y = 256
    for ic, fg, bg, name, typ, val, focus in rows:
        o += R(20, y, 350, 66, 20, SURF, PRI if focus else FIELD_LINE, 1.5 if focus else 1)
        o += icon_tile(52, y + 33, ic, fg, bg, 40, 19)
        o += T(84, y + 28, name, 14, 700) + T(84, y + 47, typ, 12, 500, MUTED)
        o += T(352, y + 39, "Rp" + val, 16, 800, EXP if ic == "card" else INK, "end", num=True)
        if focus: o += R(353, y + 24, 2, 20, 1, PRI)
        y += 74
    o += R(20, y + 2, 350, 52, 20, "none", PRI_T, 1.5, extra=' stroke-dasharray="5 5"') + I("plus", 128, y + 18, 20, PRI) + T(154, y + 33, "Tambah rekening", 14, 700, PRI)
    o += L(20, 696, 370, 696, LINE) + T(20, 722, "Total kas", 13, 600, MUTED) + T(370, 722, "Rp39.850.000", 15, 800, INK, "end", num=True)
    o += button(20, 740, 350, "Lanjut")
    return o + home_ind()

@screen("03-dashboard", "Beranda")
def s_dash():
    o = R(0, 0, W, H, 0, BG) + status_bar()
    o += avatar(40, 78, "R", PRI, ONP, 20, 16)
    o += T(70, 72, "Halo, Rina", 17, 800) + T(70, 92, "Keluarga Pratama · 3 anggota", 12, 500, MUTED)
    o += R(286, 58, 40, 40, 20, SURF, LINE) + I("eye", 296, 68, 20)
    o += R(334, 58, 40, 40, 20, SURF, LINE) + I("bell", 344, 68, 20) + C(362, 66, 4.5, EXP, SURF, 2)
    # hero
    o += f'<g filter="url(#sh)">' + f'<rect x="16" y="112" width="358" height="168" rx="26" fill="url(#hero)"/></g>' + hero_pattern(16, 112, 358, 168).replace("<g ", '<g clip-path="url(#heroclip)" ')
    o += f'<clipPath id="heroclip"><rect x="16" y="112" width="358" height="168" rx="26"/></clipPath>'
    o += T(36, 144, "Kekayaan bersih", 13, 600, PRI_T)
    p, _ = pill(354, 128, "▲ 2,4% bln ini", HERO_FG, HERO_TINT, 11, 22, "end"); o += p
    o += T(36, 184, "Rp186.450.000", 32, 800, HERO_FG, ls=-0.8, num=True)
    o += L(36, 206, 354, 206, HERO_TINT)
    for i, (lab, val, col) in enumerate([("Kas", "Rp42,3 jt", HERO_FG), ("Investasi", "Rp152,6 jt", HERO_FG), ("Utang", "−Rp8,45 jt", HERO_NEG)]):
        x = 36 + i * 112
        o += T(x, 232, lab, 12, 600, PRI_T) + T(x, 255, val, 15, 800, col, num=True)
    # month card
    o += R(16, 294, 358, 112, 22, SURF, LINE)
    o += T(34, 322, "November 2026", 14, 800) + T(356, 322, "Sisa Rp9.680.000", 13, 800, INC, "end", num=True)
    o += icon_tile(50, 356, "in", INC, INC_S, 32, 16) + T(74, 350, "Uang masuk", 11, 600, MUTED) + T(74, 368, "Rp24.500.000", 14, 800, num=True)
    o += icon_tile(214, 356, "out", EXP, EXP_S, 32, 16) + T(238, 350, "Uang keluar", 11, 600, MUTED) + T(238, 368, "Rp14.820.000", 14, 800, num=True)
    o += R(34, 386, 322, 8, 4, INC_S) + R(34, 386, 322 * 14.82 / 24.5, 8, 4, EXP)
    # health
    o += R(16, 420, 358, 120, 22, SURF, LINE)
    o += ring(72, 480, 36, .78, PRI, SURF2, 9) + T(72, 488, "78", 24, 800, INK, "middle", num=True)
    o += T(126, 450, "Skor kesehatan", 12, 600, MUTED) + T(126, 472, "Baik", 18, 800, PRI)
    bars = [("Tabungan", 1, INC), ("Anggaran", .6, WARN), ("Utang", .82, INC), ("Investasi", .7, INC)]
    for i, (lab, v, col) in enumerate(bars):
        x = 126 + (i % 2) * 116; y = 494 + (i // 2) * 26
        o += T(x, y, lab, 11, 600, MUTED) + progress(x, y + 6, 100, v, col, SURF2, 5)
    o += I("chev_r", 350, 470, 18, FAINT)
    # budgets
    o += section(572, "Anggaran bulan ini", "Lihat semua")
    rows = [("food", "Makan Luar", 1890000, 1500000, EXP), ("bag", "Belanja Bulanan", 3420000, 4000000, WARN), ("car", "Transportasi", 980000, 1200000, PRI)]
    y = 588
    for ic, name, sp, bud, col in rows:
        o += R(16, y, 358, 52, 16, SURF, LINE)
        o += icon_tile(42, y + 26, ic, col, SURF2, 32, 16)
        o += T(66, y + 22, name, 13, 700) + T(356, y + 22, f"{rp(sp)} / {rp(bud)[2:]}", 12, 700, EXP if sp > bud else INK, "end", num=True)
        o += progress(66, y + 33, 290, sp / bud, col, SURF2, 6)
        y += 58
    o += section(782, "Transaksi terakhir", "Semua")
    o += f'<rect x="0" y="690" width="{W}" height="70" fill="url(#fade)"/>'
    return o + bottom_nav("Beranda")

@screen("04-add-transaction", "Tambah transaksi")
def s_add():
    o = R(0, 0, W, H, 0, BG) + status_bar()
    o += R(16, 112, 358, 168, 26, HERO2) + R(16, 294, 358, 112, 22, SURF) + R(16, 420, 358, 120, 22, SURF)
    o += R(0, 0, W, H, 0, "#0B1310", op=.55)
    o += R(0, 118, W, 760, 30, SURF) + R(W / 2 - 20, 128, 40, 5, 2.5, SURF3)
    o += T(20, 168, "Catat transaksi", 19, 800, ls=-0.3) + R(334, 146, 36, 36, 18, SURF2) + I("close", 342, 154, 20)
    # segmented
    o += R(20, 190, 350, 42, 21, SURF2)
    segs = ["Keluar", "Masuk", "Transfer", "Aset"]
    for i, s in enumerate(segs):
        x = 24 + i * 85.5
        if i == 0: o += R(x, 194, 85.5, 34, 17, SURF, extra=' filter="url(#sh)"')
        o += T(x + 42.75, 216, s, 13, 700 if i == 0 else 600, EXP if i == 0 else MUTED, "middle")
    o += T(W / 2, 266, "Jumlah", 12, 600, MUTED, "middle")
    o += T(W / 2, 308, "Rp287.500", 38, 800, INK, "middle", ls=-1, num=True) + R(W / 2 + 96, 280, 2.5, 34, 1, PRI)
    x = 20
    for i, (ic, s) in enumerate([("bag", "Belanja Bulanan"), ("food", "Makan Luar"), ("car", "Transportasi"), ("zap", "Listrik")]):
        c, w = chip(x, 334, s, i == 0, 36, 13, ic); o += c; x += w + 8
    fields = [("wallet", "Dari rekening", "Bank BCA · Rp28.640.000"), ("cal", "Tanggal", "Hari ini, 26 Nov"), ("edit", "Catatan", "Indomaret Pratama")]
    y = 386
    o += R(20, y, 350, 138, 18, SURF, FIELD_LINE)
    for i, (ic, lab, val) in enumerate(fields):
        yy = y + i * 46
        if i: o += L(56, yy, 370, yy, LINE)
        o += I(ic, 34, yy + 13, 20, MUTED) + T(64, yy + 28, lab, 13, 500, MUTED) + T(340, yy + 28, val, 13, 700, INK, "end") + I("chev_r", 344, yy + 15, 16, FAINT)
    # numpad
    keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "⌫"]
    for i, k in enumerate(keys):
        cx = 20 + (i % 3) * 118 + 55; cy = 540 + (i // 3) * 50
        o += R(cx - 55, cy, 110, 42, 14, SURF2)
        if k == "⌫": o += I("backspace", cx - 11, cy + 10, 22, INK)
        else: o += T(cx, cy + 28, k, 20, 700, INK, "middle")
    o += button(20, 746, 350, "Simpan", "primary", 52, "check")
    o += T(W / 2, 818, "Tekan lama + untuk scan struk", 11, 500, FAINT, "middle")
    return o + home_ind()

@screen("05-transactions", "Daftar transaksi")
def s_tx():
    o = R(0, 0, W, H, 0, BG) + status_bar()
    o += app_bar("Transaksi", right=("download", "search"))
    o += R(20, 108, 350, 44, 22, SURF, LINE) + I("chev_l", 32, 120, 20, MUTED) + T(W / 2, 136, "November 2026", 14, 800, INK, "middle") + I("chev_r", 338, 120, 20, MUTED)
    o += R(20, 162, 171, 58, 18, INC_S) + T(36, 184, "Masuk", 12, 600, INC) + T(36, 206, "+Rp24.500.000", 15, 800, INC, num=True)
    o += R(199, 162, 171, 58, 18, EXP_S) + T(215, 184, "Keluar", 12, 600, EXP) + T(215, 206, "−Rp14.820.000", 15, 800, EXP, num=True)
    x = 20
    for i, s in enumerate(["Semua", "Keluar", "Masuk", "Transfer", "Aset"]):
        c, w = chip(x, 232, s, i == 0, 34, 13); o += c; x += w + 8
    groups = [
        ("HARI INI · KAMIS, 26 NOV", "−Rp311.500", [
            ("bag", EXP, EXP_S, "Indomaret", "Belanja Bulanan · BCA", "−Rp287.500", EXP, None, "R"),
            ("car", EXP, EXP_S, "GoRide", "Transportasi · GoPay", "−Rp24.000", EXP, ("Scan", INC, INC_S), "B")]),
        ("RABU, 25 NOV", "+Rp17.814.000", [
            ("brief", INC, INC_S, "Gaji Pokok", "Gaji · BCA", "+Rp18.500.000", INC, None, "B"),
            ("transfer", TRF, TRF_S, "BCA → GoPay", "Transfer", "Rp500.000", TRF, None, "R"),
            ("repeat", EXP, EXP_S, "Netflix", "Langganan · Kartu Kredit", "−Rp186.000", EXP, ("Otomatis", AUTO, AUTO_S), None)]),
        ("SELASA, 24 NOV", "", [
            ("coins", INV, INV_S, "Beli Emas Antam", "Investasi · Mandiri", "Rp2.000.000", INV, None, "B")]),
    ]
    y = 286
    for head, tot, rows in groups:
        o += T(20, y + 14, head, 11, 700, FAINT, ls=0.6) + (T(370, y + 14, tot, 11, 700, FAINT, "end", num=True) if tot else "")
        y += 24
        o += R(20, y, 350, len(rows) * 62 + 4, 20, SURF, LINE)
        for i, r in enumerate(rows):
            if i: o += L(84, y + i * 62 + 2, 356, y + i * 62 + 2, LINE)
            o += tx_row(y + i * 62 + 10, *r[:7], x=32, w=326, badge=r[7], who=r[8])
        y += len(rows) * 62 + 18
    return o + bottom_nav("Transaksi")

@screen("06-wallets", "Rekening")
def s_wallets():
    o = R(0, 0, W, H, 0, BG) + status_bar()
    o += app_bar("Rekening", right=("plus",))
    o += R(20, 108, 350, 92, 22, SURF, LINE)
    o += T(38, 136, "Total kas", 12, 600, MUTED) + T(38, 166, "Rp42.300.000", 24, 800, ls=-0.5, num=True)
    o += T(352, 136, "Total utang", 12, 600, MUTED, "end") + T(352, 166, "−Rp8.450.000", 16, 800, EXP, "end", num=True)
    o += T(38, 188, "5 rekening · 2 utang", 11, 500, FAINT)
    x = 20
    for i, s in enumerate(["Semua", "Bersama", "Pribadi"]):
        c, w = chip(x, 214, s, i == 0, 32, 12); o += c; x += w + 8
    o += section(276, "Uang & tabungan")
    rows = [("bank", PRI, PRI_S, "Bank BCA", "Bank · Bersama", 28640000),
            ("bank", TRF, TRF_S, "Bank Mandiri", "Bank · Bersama", 9120000),
            ("verified" if False else "trend", INV, INV_S, "RDN Saham", "RDN · Budi", 2450000),
            ("wallet", INC, INC_S, "GoPay", "E-wallet · Rina", 1240000),
            ("cash", INV, INV_S, "Dompet Tunai", "Tunai · Bersama", 850000)]
    y = 290
    o += R(20, y, 350, len(rows) * 58 + 4, 20, SURF, LINE)
    for i, (ic, fg, bg, n, s, v) in enumerate(rows):
        yy = y + i * 58
        if i: o += L(80, yy + 2, 356, yy + 2, LINE)
        o += icon_tile(52, yy + 31, ic, fg, bg, 38, 18) + T(82, yy + 26, n, 14, 700) + T(82, yy + 44, s, 12, 500, MUTED)
        o += T(352, yy + 35, rp(v), 14, 800, INK, "end", num=True)
    y += len(rows) * 58 + 30
    o += section(y, "Utang")
    y += 14
    debts = [("card", "Kartu Kredit Mandiri", 6200000, 15000000, "Jatuh tempo 5 Des"), ("card", "PayLater", 2250000, 5000000, "Cicilan 2 dari 3")]
    for n, (ic, name, used, lim, note) in enumerate(debts):
        o += R(20, y, 350, 86, 20, SURF, LINE)
        o += icon_tile(52, y + 30, ic, EXP, EXP_S, 38, 18) + T(82, y + 26, name, 14, 700) + T(82, y + 44, note, 12, 500, MUTED)
        o += T(352, y + 35, rp(-used), 14, 800, EXP, "end", num=True)
        o += progress(34, y + 62, 322, used / lim, EXP if used / lim > .3 else WARN, EXP_S, 6)
        o += T(34, y + 80, f"Terpakai {int(used / lim * 100)}% dari {rp(lim)}", 10.5, 600, MUTED)
        y += 94
    return o + bottom_nav("Lainnya")

@screen("07-budget", "Anggaran bulanan")
def s_budget():
    o = R(0, 0, W, H, 0, BG) + status_bar()
    o += app_bar("Anggaran", right=("sliders",))
    o += R(20, 108, 350, 44, 22, SURF, LINE) + I("chev_l", 32, 120, 20, MUTED) + T(W / 2, 136, "November 2026", 14, 800, INK, "middle") + I("chev_r", 338, 120, 20, MUTED)
    o += R(20, 164, 350, 166, 24, SURF, LINE)
    o += T(38, 192, "Penghasilan bulan ini", 12, 600, MUTED) + T(38, 222, "Rp24.500.000", 26, 800, ls=-0.6, num=True)
    p, _ = pill(352, 178, "Tersimpan otomatis", INC, INC_S, 10.5, 22, "end"); o += p
    bw = 314; segs = [(17 / 24.5, EXP), (5 / 24.5, INV), (2.5 / 24.5, SURF3)]
    x = 38
    for i, (f, c) in enumerate(segs):
        o += R(x, 238, bw * f - 3, 12, 6, c); x += bw * f
    leg = [("Pengeluaran", "Rp17 jt", EXP), ("Investasi", "Rp5 jt", INV), ("Belum diatur", "Rp2,5 jt", FAINT)]
    for i, (l, v, c) in enumerate(leg):
        lx = 38 + i * 108
        o += C(lx + 4, 270, 4, c) + T(lx + 13, 274, l, 11, 600, MUTED) + T(lx, 294, v, 13, 800, INK, num=True)
    o += R(38, 306, 0, 0)
    # actions
    o += button(20, 342, 171, "Wizard", "soft", 42, "spark", 13)
    o += button(199, 342, 171, "Bawa sisa Okt", "ghost", 42, "repeat", 13)
    # alert
    o += R(20, 398, 350, 50, 16, EXP_S) + I("alert", 34, 411, 22, EXP) + T(66, 419, "Makan Luar lewat Rp390.000", 13, 700, EXP) + T(66, 436, "Sisa 4 hari. Kurangi atau pindahkan dana.", 11, 500, EXP_D)
    o += section(480, "Per kategori", "Ubah")
    cats = [("food", "Makan Luar", 1890000, 1500000, "Melebihi", EXP, EXP_S),
            ("cash", "Pendidikan (SPP)", 2500000, 2500000, "Pas", WARN, WARN_S),
            ("bag", "Belanja Bulanan", 3420000, 4000000, "Hampir habis", WARN, WARN_S),
            ("car", "Transportasi", 980000, 1200000, "Aman", INC, INC_S),
            ("zap", "Listrik & Air", 640000, 900000, "Aman", INC, INC_S)]
    y = 494
    for ic, n, sp, bud, st, c, cs in cats:
        o += R(20, y, 350, 62, 18, SURF, LINE)
        o += icon_tile(46, y + 24, ic, c, cs, 32, 16) + T(70, y + 22, n, 13, 700)
        p, _ = pill(70 + tw(n, 13, 700) + 8, y + 9, st, c, cs, 10, 18); o += p
        o += T(354, y + 22, f"{rp(sp)}", 13, 800, EXP if sp > bud else INK, "end", num=True)
        o += progress(70, y + 36, 284, sp / bud, c, SURF2, 6)
        o += T(70, y + 55, f"dari {rp(bud)}", 10.5, 500, FAINT) + T(354, y + 55, ("Lewat " + rp(sp - bud)) if sp > bud else ("Sisa " + rp(bud - sp)), 10.5, 700, EXP if sp > bud else MUTED, "end", num=True)
        y += 70
    return o + bottom_nav("Anggaran")

@screen("08-budget-wizard", "Wizard anggaran")
def s_wizard():
    o = R(0, 0, W, H, 0, BG) + status_bar()
    o += R(16, 56, 40, 40, 20, SURF, LINE) + I("close", 26, 66, 20)
    steps = ["Metode", "Penghasilan", "Alokasi", "Kategori", "Simpan"]
    for i, s in enumerate(steps):
        x = 72 + i * 60
        o += R(x, 74, 52, 5, 2.5, PRI if i <= 2 else SURF3)
    o += T(20, 132, "Langkah 3 dari 5 · Alokasi", 12, 700, PRI, ls=0.3)
    o += T(20, 164, "Bagaimana kamu ingin", 24, 800, ls=-0.5) + T(20, 194, "membagi Rp24.500.000?", 24, 800, ls=-0.5, num=True)
    opts = [("50/30/20", "Klasik", "Kebutuhan 50 · Keinginan 30 · Tabungan 20", True),
            ("60/20/20", "Hemat", "Kebutuhan 60 · Keinginan 20 · Tabungan 20", False),
            ("70/10/20", "Kebutuhan", "Kebutuhan 70 · Keinginan 10 · Tabungan 20", False),
            ("Atur sendiri", "", "Persentase atau nominal tetap", False)]
    y = 220
    for big, tag, desc, on in opts:
        o += R(20, y, 350, 66, 18, PRI_S if on else SURF, PRI if on else LINE, 1.6 if on else 1)
        o += C(46, y + 33, 10, SURF, PRI if on else SURF3, 2) + (C(46, y + 33, 5, PRI) if on else "")
        o += T(68, y + 29, big, 16, 800, INK, num=True)
        if tag:
            p, _ = pill(68 + tw(big, 16, 800) + 10, y + 14, tag, PRI if on else MUTED, SURF if on else SURF2, 10, 20); o += p
        o += T(68, y + 50, desc, 12, 500, MUTED)
        y += 76
    # preview
    o += R(20, 534, 350, 190, 22, SURF, LINE)
    o += T(38, 562, "Pratinjau", 13, 800)
    o += donut(100, 640, 50, [(.5, PRI), (.3, GOLD), (.2, TRF)], 20)
    o += T(100, 636, "100%", 14, 800, INK, "middle") + T(100, 653, "terbagi", 10.5, 500, MUTED, "middle")
    rows = [("Kebutuhan", "Rp12.250.000", PRI), ("Keinginan", "Rp7.350.000", GOLD), ("Tabungan & investasi", "Rp4.900.000", TRF)]
    for i, (l, v, c) in enumerate(rows):
        yy = 600 + i * 38
        o += R(178, yy - 9, 10, 10, 3, c) + T(196, yy, l, 12, 600, MUTED) + T(196, yy + 17, v, 14, 800, INK, num=True)
    o += T(38, 712, "Plafon pengeluaran = Kebutuhan + Keinginan = Rp19.600.000", 10.5, 600, FAINT, num=True)
    o += button(20, 742, 110, "Kembali", "ghost") + button(140, 742, 230, "Lanjut ke kategori", "primary")
    return o + home_ind()

@screen("09-savings-goals", "Target tabungan")
def s_goals():
    o = R(0, 0, W, H, 0, BG) + status_bar()
    o += app_bar("Target Tabungan", back=True, right=("plus",))
    o += f'<rect x="20" y="108" width="350" height="104" rx="24" fill="url(#hero)"/>'
    o += T(38, 136, "Total terkumpul", 12, 600, PRI_T) + T(38, 166, "Rp70.500.000", 24, 800, HERO_FG, ls=-0.5, num=True)
    o += T(352, 166, "47%", 22, 800, GOLD, "end", num=True)
    o += progress(38, 182, 314, .467, GOLD, HERO_TINT, 8) + T(38, 204, "dari Rp151.000.000 · 4 target", 11, 500, PRI_T, num=True)
    goals = [("shield", "Dana Darurat", 30e6, 54e6, "Des 2027 · 13 bln lagi", "Sesuai jalur", INC, INC_S, "Setor Rp1.846.200/bln"),
             ("heart", "Umroh Keluarga", 18.5e6, 70e6, "Okt 2028 · 23 bln lagi", "Perlu perhatian", WARN, WARN_S, "Butuh Rp2.239.100/bln · laju Rp1,2 jt"),
             ("globe", "Liburan Bali", 7e6, 12e6, "Jun 2027 · 7 bln lagi", "Sesuai jalur", INC, INC_S, "Setor Rp714.300/bln"),
             ("check", "Laptop Kerja", 15e6, 15e6, "Tercapai 12 Okt 2026", "Tercapai", PRI, PRI_S, "Selamat! Pindahkan ke target lain?")]
    y = 228
    for ic, n, cur, tgt, when, st, c, cs, hint in goals:
        o += R(20, y, 350, 128, 22, SURF, LINE)
        o += icon_tile(54, y + 34, ic, c, cs, 42, 20) + T(86, y + 30, n, 15, 800) + T(86, y + 49, when, 11.5, 500, MUTED)
        p, _ = pill(352, y + 16, st, c, cs, 10.5, 22, "end"); o += p
        o += T(38, y + 82, rp(cur), 16, 800, INK, num=True) + T(38 + tw(rp(cur), 16, 800) + 6, y + 82, f"/ {rp(tgt)}", 12, 600, FAINT, num=True)
        o += T(352, y + 82, f"{int(cur / tgt * 100)}%", 14, 800, c, "end", num=True)
        o += progress(38, y + 92, 314, cur / tgt, c, SURF2, 7)
        o += T(38, y + 117, hint, 11, 600, MUTED, num=True)
        if cur < tgt: o += T(352, y + 117, "+ Setor", 12, 800, PRI, "end")
        y += 138
    return o + home_ind()

@screen("10-investments", "Investasi")
def s_inv():
    o = R(0, 0, W, H, 0, BG) + status_bar()
    o += app_bar("Investasi", back=True, right=("plus",))
    o += R(20, 108, 350, 196, 24, SURF, LINE)
    o += T(38, 136, "Nilai portofolio", 12, 600, MUTED) + T(38, 168, "Rp152.600.000", 26, 800, ls=-0.6, num=True)
    p, _ = pill(38, 180, "+Rp12.400.000 (+8,8%)", INC, INC_S, 11, 22); o += p
    o += T(352, 136, "Modal", 12, 600, MUTED, "end") + T(352, 156, "Rp140,2 jt", 13, 800, INK, "end", num=True)
    # chart
    pts = [(38, 280), (100, 272), (162, 266), (224, 258), (286, 246), (352, 226)]
    modal = [(38, 284), (100, 280), (162, 276), (224, 270), (286, 262), (352, 252)]
    d = "M" + " L".join(f"{x},{y}" for x, y in pts)
    o += f'<path d="{d} L352,292 L38,292 Z" fill="url(#area)"/>' + f'<path d="{d}" fill="none" stroke="{PRI}" stroke-width="2.5" stroke-linejoin="round"/>'
    o += f'<path d="M' + " L".join(f"{x},{y}" for x, y in modal) + f'" fill="none" stroke="{FAINT}" stroke-width="1.5" stroke-dasharray="4 4"/>'
    o += C(352, 226, 5, PRI, SURF, 2)
    for i, m in enumerate(["Jun", "Jul", "Agu", "Sep", "Okt", "Nov"]):
        o += T(38 + i * 62.8, 300 - 0, "", 1)
    o += section(336, "Target per jenis")
    types = [("coins", "Emas", 48e6, 100e6, GOLD), ("trend", "Saham Bluechip", 72.6e6, 500e6, PRI), ("cash", "Reksa Dana Pasar Uang", 32e6, 50e6, TRF)]
    y = 350
    for ic, n, cur, tgt, c in types:
        o += T(20, y + 16, n, 13, 700) + T(370, y + 16, f"{rp(cur)} / {int(tgt / 1e6)} jt", 12, 700, MUTED, "end", num=True)
        o += progress(20, y + 26, 350, cur / tgt, c, SURF2, 7)
        y += 44
    o += section(504, "Aset", "Beli · Jual")
    assets = [("coins", INV, INV_S, "Emas Antam", "Emas · 30 gram", 48000000, "+12,1%"),
              ("trend", PRI, PRI_S, "BBCA", "Saham · 3.000 lembar", 27600000, "+6,4%"),
              ("trend", PRI, PRI_S, "BBRI", "Saham · 9.000 lembar", 45000000, "+4,2%"),
              ("cash", TRF, TRF_S, "RDPU Syariah", "Reksa dana · 21.430 unit", 32000000, "+3,1%")]
    y = 518
    o += R(20, y, 350, len(assets) * 58 + 4, 20, SURF, LINE)
    for i, (ic, fg, bg, n, s, v, g) in enumerate(assets):
        yy = y + i * 58
        if i: o += L(80, yy + 2, 356, yy + 2, LINE)
        o += icon_tile(52, yy + 31, ic, fg, bg, 38, 18) + T(82, yy + 26, n, 14, 700) + T(82, yy + 44, s, 12, 500, MUTED)
        o += T(352, yy + 26, rp(v), 14, 800, INK, "end", num=True) + T(352, yy + 44, g, 12, 700, INC, "end", num=True)
    return o + home_ind()

@screen("11-subscriptions", "Langganan")
def s_subs():
    o = R(0, 0, W, H, 0, BG) + status_bar()
    o += app_bar("Langganan", back=True, right=("plus",))
    o += R(20, 108, 350, 128, 24, SURF, LINE)
    o += T(38, 136, "Biaya rutin per bulan", 12, 600, MUTED) + T(38, 168, "Rp1.452.800", 26, 800, ls=-0.6, num=True)
    o += T(352, 168, "Rp17,4 jt/thn", 13, 700, MUTED, "end", num=True)
    o += R(38, 184, 314, 38, 12, WARN_S) + I("bell", 48, 193, 18, WARN) + T(74, 207, "Spotify Family · 3 Des (7 hari lagi)", 12, 700, WARN_D)
    x = 20
    for i, s in enumerate(["Tanggal bayar", "Biaya", "Nama"]):
        c, w = chip(x, 250, s, i == 0, 32, 12); o += c; x += w + 8
    subs = [("S", "#2F7F69", "Spotify Family", "Tgl 3 · BCA", 86900, None),
            ("I", "#B4442F", "IndiHome", "Tgl 10 · BCA", 385000, None),
            ("G", "#3A68A8", "Google One 2TB", "Tgl 14 · Kartu Kredit", 26900, None),
            ("C", "#4A4F57", "ChatGPT Plus", "Tgl 18 · Kartu Kredit", 318000, "US$20 · kurs 15.900"),
            ("N", "#8E2A2A", "Netflix", "Tgl 25 · Kartu Kredit", 186000, "Tercatat otomatis 25 Nov"),
            ("A", "#7A5B2E", "Asuransi Mobil", "Tahunan · Mar · Mandiri", 450000, "Rp5.400.000/thn")]
    y = 298
    o += R(20, y, 350, len(subs) * 64 + 4, 20, SURF, LINE)
    for i, (l, c, n, s, v, note) in enumerate(subs):
        yy = y + i * 64
        if i: o += L(80, yy + 2, 356, yy + 2, LINE)
        o += R(33, yy + 13, 38, 38, 12, c) + T(52, yy + 38, l, 16, 800, "#FFFFFF", "middle")
        o += T(82, yy + 28, n, 14, 700) + T(82, yy + 46, note or s, 11.5, 500, INC if note and "otomatis" in note else MUTED)
        o += T(352, yy + 28, rp(v), 14, 800, INK, "end", num=True) + T(352, yy + 46, "/bln", 11, 500, FAINT, "end")
    o += R(20, 700, 350, 44, 14, PRI_S) + I("repeat", 34, 711, 20, PRI) + T(64, 727, "Transaksi dibuat otomatis tiap tanggal bayar", 12, 700, PRI)
    return o + home_ind()

@screen("12-quick-add-scan", "Tinjau hasil scan")
def s_scan():
    o = R(0, 0, W, H, 0, BG) + status_bar()
    o += app_bar("Tinjau hasil scan", back=True)
    o += R(20, 108, 350, 88, 20, SURF, LINE)
    o += R(32, 120, 50, 64, 10, SURF2) + I("img", 45, 140, 24, FAINT)
    o += T(96, 140, "Mutasi Bank BCA", 15, 800) + T(96, 160, "4 transaksi ditemukan · 25–26 Nov", 12, 500, MUTED)
    p, _ = pill(96, 168, "Gambar dihapus setelah simpan", PRI, PRI_S, 10, 20); o += p
    o += T(20, 228, "Centang yang mau disimpan", 13, 700, MUTED)
    rows = [(True, "26 Nov", "QRIS INDOMARET PRATAMA", "Belanja Bulanan", -287500, None),
            (True, "26 Nov", "GOPAY TOPUP", "Transfer → GoPay", -500000, "Ditandai transfer"),
            (True, "25 Nov", "TRSF CR GAJI NOV", "Gaji Pokok", 18500000, None),
            (False, "25 Nov", "BIAYA ADM", "Pilih kategori", -10000, "Cek kategori")]
    y = 242
    for on, d, desc, cat, amt, warn in rows:
        h = 108
        o += R(20, y, 350, h, 20, SURF, WARN if warn == "Cek kategori" else LINE, 1.5 if warn == "Cek kategori" else 1)
        o += R(34, y + 16, 22, 22, 7, PRI if on else SURF, None if on else SURF3, 2) + (I("check", 37, y + 19, 16, ONP, 2.6) if on else "")
        o += T(68, y + 25, desc, 13, 700) + T(68, y + 43, d + " · Bank BCA", 11.5, 500, MUTED)
        o += T(356, y + 25, rp(amt, True), 14, 800, INC if amt > 0 else EXP, "end", num=True)
        o += L(34, y + 58, 356, y + 58, LINE)
        cc = TRF if "Transfer" in cat else (WARN if "Pilih" in cat else INK)
        o += R(68, y + 68, tw(cat, 12, 700) + 40, 28, 14, SURF2) + I("tag", 78, y + 75, 14, cc) + T(97, y + 86, cat, 12, 700, cc) + I("chev_d", 97 + tw(cat, 12, 700) + 2, y + 76, 12, MUTED)
        if warn:
            p, _ = pill(356, y + 71, warn, WARN_D if "Cek" in warn else TRF, WARN_S if "Cek" in warn else TRF_S, 10, 22, "end"); o += p
        y += h + 10
    o += R(0, 716, W, 128, 0, BG) + L(0, 716, W, 716, LINE)
    o += T(20, 742, "3 transaksi · total bersih", 12, 600, MUTED) + T(370, 742, "+Rp17.712.500", 14, 800, INC, "end", num=True)
    o += button(20, 758, 350, "Simpan 3 transaksi", "primary", 52)
    return o + home_ind()

@screen("13-ai-advisor", "Asisten AI")
def s_ai():
    o = R(0, 0, W, H, 0, BG) + status_bar()
    o += R(16, 56, 40, 40, 20, SURF, LINE) + I("chev_l", 26, 66, 20)
    o += R(66, 56, 40, 40, 14, HERO2) + I("spark", 76, 66, 20, GOLD, 2)
    o += T(116, 73, "Asisten Vynance", 16, 800) + T(116, 91, "Pakai data bulan ini · edukasi, bukan nasihat resmi", 10.5, 500, MUTED)
    # context card
    o += R(20, 112, 350, 56, 16, SURF, LINE) + I("shield", 34, 128, 22, PRI)
    o += T(66, 134, "Yang aku lihat: skor 78, 5 kategori teratas,", 11.5, 600, MUTED) + T(66, 152, "4 target, portofolio. Tanpa nama rekening.", 11.5, 600, MUTED)
    # user bubble
    o += R(130, 186, 240, 46, 20, INK) + T(148, 214, "Gimana kondisi keuanganku?", 13, 600, ON_INK)
    # ai bubble
    o += R(20, 248, 300, 250, 20, SURF, LINE)
    lines = [("Secara umum sehat. Skor kamu 78 (Baik).", 700, INK),
             ("", 400, INK),
             ("✓ Tabungan 39,5% dari pemasukan,", 500, INK),
             ("   jauh di atas target 20%.", 500, INK),
             ("✓ Pemakaian kartu kredit 41%.", 500, INK),
             ("", 400, INK),
             ("Yang perlu dicek:", 700, INK),
             ("• Makan Luar Rp1.890.000, lewat 26%", 500, INK),
             ("   dari anggaran Rp1.500.000.", 500, INK),
             ("• Target Umroh butuh Rp2,24 jt/bln,", 500, INK),
             ("   laju setoran baru Rp1,2 jt.", 500, INK)]
    yy = 274
    for t, w_, c in lines:
        if t: o += T(38, yy, t, 12.5, w_, c, num=True)
        yy += 19
    o += R(20, 508, 300, 74, 20, SURF, LINE)
    o += T(38, 534, "Saran: pindahkan Rp500.000 dari sisa", 12.5, 500) + T(38, 553, "anggaran Transportasi ke target Umroh?", 12.5, 500)
    o += T(38, 572, "", 1)
    o += button(20, 592, 172, "Pindahkan dana", "soft", 38, None, 12.5) + button(200, 592, 120, "Nanti", "ghost", 38, None, 12.5)
    # quick prompts
    o += T(20, 660, "Coba tanya", 12, 700, MUTED)
    x = 20
    for s in ["Tips hemat bulan ini", "Porsi investasiku cukup?"]:
        c, w = chip(x, 672, s, False, 34, 12); o += c; x += w + 8
    # input
    o += R(0, 728, W, 116, 0, BG)
    o += R(20, 742, 290, 52, 26, SURF, FIELD_LINE) + T(42, 773, "Tanya soal keuanganmu…", 14, 500, FAINT) + I("mic", 276, 756, 22, MUTED)
    o += C(344, 768, 26, PRI) + I("send", 333, 757, 22, ONP, 2)
    return o + home_ind()

@screen("14-more-menu", "Menu Lainnya")
def s_more():
    o = R(0, 0, W, H, 0, BG) + status_bar()
    o += app_bar("Lainnya")
    o += R(20, 108, 350, 76, 22, SURF, LINE) + avatar(56, 146, "R", PRI, ONP, 22, 17)
    o += T(90, 140, "Rina Pratama", 15, 800) + T(90, 160, "Pemilik · Keluarga Pratama", 12, 500, MUTED) + I("chev_r", 340, 136, 20, FAINT)
    groups = [("UANG", [("wallet", "Rekening"), ("target", "Target"), ("trend", "Investasi"), ("repeat", "Langganan")]),
              ("PERENCANAAN", [("school", "Pendidikan"), ("brief", "Penghasilan"), ("hand", "Zakat"), ("spark", "Asisten AI")]),
              ("DATA", [("doc", "Slip Gaji"), ("tag", "Kategori"), ("users", "Keluarga"), ("download", "Ekspor")])]
    y = 206
    for g, items in groups:
        o += T(20, y + 12, g, 11, 700, FAINT, ls=0.8)
        y += 22
        for i, (ic, lab) in enumerate(items):
            x = 20 + i * 89
            o += R(x, y, 83, 84, 20, SURF, LINE)
            o += icon_tile(x + 41.5, y + 32, ic, PRI, PRI_S, 40, 20, 14)
            o += T(x + 41.5, y + 70, lab, 11.5, 700, INK, "middle")
        y += 100
    o += T(20, y + 12, "APLIKASI", 11, 700, FAINT, ls=0.8)
    y += 22
    o += R(20, y, 350, 170, 20, SURF, LINE)
    rows = [("eye", "Sembunyikan nominal", "toggle", False), ("moon", "Mode gelap", "toggle", False), ("globe", "Bahasa", "Indonesia", None)]
    for i, (ic, lab, kind, on) in enumerate(rows):
        yy = y + i * 46
        if i: o += L(56, yy, 370, yy, LINE)
        o += I(ic, 34, yy + 13, 20, MUTED) + T(64, yy + 28, lab, 13.5, 600)
        if kind == "toggle": o += toggle(312, yy + 10, on)
        else: o += T(340, yy + 28, kind, 13, 600, MUTED, "end") + I("chev_r", 344, yy + 15, 16, FAINT)
    o += L(20, y + 138, 370, y + 138, LINE) + I("logout", 34, y + 143, 18, EXP) + T(64, y + 157, "Keluar", 13.5, 700, EXP)
    return o + bottom_nav("Lainnya")

@screen("15-zakat", "Kalkulator zakat")
def s_zakat():
    o = R(0, 0, W, H, 0, BG) + status_bar()
    o += app_bar("Zakat Maal", back=True, right=("info",))
    o += R(20, 108, 350, 72, 20, SURF, LINE) + icon_tile(52, 144, "coins", INV, INV_S, 40, 20)
    o += T(84, 138, "Harga emas", 12, 600, MUTED) + T(84, 160, "Rp1.580.000 / gram", 15, 800, num=True)
    p, _ = pill(352, 122, "Live · 08.00", INC, INC_S, 10, 20, "end"); o += p
    o += T(352, 166, "Ubah", 12, 800, PRI, "end")
    o += R(20, 192, 350, 200, 22, SURF, LINE)
    o += T(38, 220, "Harta yang dihitung", 13, 800)
    rows = [("Kas semua rekening", "+Rp42.300.000", INK), ("Investasi (nilai kini)", "+Rp152.600.000", INK), ("Utang jatuh tempo", "−Rp8.450.000", EXP)]
    for i, (l, v, c) in enumerate(rows):
        yy = 252 + i * 32
        o += T(38, yy, l, 13, 500, MUTED) + T(352, yy, v, 13, 700, c, "end", num=True)
    o += L(38, 334, 352, 334, LINE, 1, "4 4")
    o += T(38, 364, "Total harta", 13, 800) + T(352, 364, "Rp186.450.000", 16, 800, INK, "end", num=True)
    o += R(38, 374, 0, 0)
    # nisab compare
    o += R(20, 404, 350, 96, 22, SURF, LINE)
    o += T(38, 432, "Nisab (85 g emas)", 12, 600, MUTED) + T(352, 432, "Rp134.300.000", 13, 800, INK, "end", num=True)
    o += R(38, 446, 314, 10, 5, SURF2) + R(38, 446, 314, 10, 5, INC) + L(38 + 314 * 134.3 / 186.45, 440, 38 + 314 * 134.3 / 186.45, 462, INK, 2)
    o += I("check", 38, 470, 18, INC) + T(62, 484, "Harta di atas nisab — wajib zakat", 12.5, 700, INC)
    # amount
    o += f'<rect x="20" y="514" width="350" height="128" rx="24" fill="url(#hero)"/>'
    o += T(W / 2, 550, "Zakat yang perlu dibayar (2,5%)", 12.5, 600, PRI_T, "middle")
    o += T(W / 2, 594, "Rp4.661.250", 34, 800, HERO_FG, "middle", ls=-0.8, num=True)
    o += T(W / 2, 622, "Haul tercapai: 14 Maret 2026", 11.5, 600, GOLD, "middle")
    o += R(20, 656, 350, 52, 16, SURF2) + I("info", 34, 670, 20, MUTED) + T(64, 679, "Hitungan ini perkiraan. Konsultasikan", 11.5, 500, MUTED) + T(64, 696, "dengan lembaga amil zakat bila ragu.", 11.5, 500, MUTED)
    o += button(20, 740, 350, "Catat pembayaran zakat", "primary", 52, "check")
    return o + home_ind()

@screen("16-education-fund", "Dana pendidikan")
def s_edu():
    o = R(0, 0, W, H, 0, BG) + status_bar()
    o += app_bar("Dana Pendidikan", back=True, right=("sliders",))
    x = 20
    for i, s in enumerate(["Alya · 6 th", "Raka · 3 th", "+ Anak"]):
        c, w = chip(x, 108, s, i == 0, 36, 13); o += c; x += w + 8
    o += R(20, 158, 350, 120, 24, SURF, LINE)
    o += T(38, 186, "Perlu disisihkan", 12, 600, MUTED) + T(38, 218, "Rp5.434.000/bln", 26, 800, ls=-0.6, num=True)
    o += T(38, 244, "Tabungan pendidikan Alya", 12, 500, MUTED) + T(352, 244, "Rp15.000.000", 13, 800, INK, "end", num=True)
    o += T(38, 266, "Asumsi inflasi pendidikan 12%/tahun", 11, 600, FAINT) + T(352, 266, "Ubah", 12, 800, PRI, "end")
    levels = [("TK", "2024–2026", "Selesai", None, None, FAINT, SURF2, 0),
              ("SD", "2026–2032", "Berjalan", "Biaya kini Rp15 jt/thn", None, PRI, PRI_S, 0),
              ("SMP", "Mulai 2032 · 6 th lagi", "Akan datang", "Rp49.350.000", "Rp477.100/bln", INV, INV_S, 1),
              ("SMA", "Mulai 2035 · 9 th lagi", "Akan datang", "Rp97.060.000", "Rp898.700/bln", INV, INV_S, 1),
              ("Kuliah", "Mulai 2038 · 12 th lagi", "Akan datang", "Rp584.400.000", "Rp4.058.300/bln", INV, INV_S, 1)]
    y = 300
    o += L(46, y + 20, 46, y + 4 * 88 + 20, SURF3, 2)
    for lv, when, st, cost, mon, c, cs, up in levels:
        o += C(46, y + 22, 13, cs, c, 2) + (I("check", 39, y + 15, 14, c, 2.4) if st == "Selesai" else C(46, y + 22, 4, c))
        o += R(70, y, 300, 76, 18, SURF, PRI if st == "Berjalan" else LINE, 1.5 if st == "Berjalan" else 1)
        o += T(86, y + 24, lv, 15, 800, FAINT if st == "Selesai" else INK) + T(86, y + 42, when, 11.5, 500, MUTED)
        p, _ = pill(356, y + 11, st, c, cs, 10, 20, "end")
        if st != "Selesai": o += p
        if cost: o += T(86, y + 64, cost, 13, 800 if up else 600, INK if up else MUTED, num=True)
        if mon: o += T(356, y + 64, mon, 13, 800, PRI, "end", num=True)
        y += 88
    return o + home_ind()

@screen("17-family-space", "Ruang keluarga")
def s_family():
    o = R(0, 0, W, H, 0, BG) + status_bar()
    o += app_bar("Keluarga Pratama", back=True, right=("edit",))
    o += R(20, 108, 350, 270, 22, SURF, LINE)
    o += T(38, 136, "Anggota", 13, 800) + T(352, 136, "3 dari 6", 12, 600, MUTED, "end")
    mem = [("R", PRI, "Rina Pratama", "Kamu", "Pemilik"), ("B", TRF, "Budi Pratama", "Aktif 5 mnt lalu", "Pengelola"), ("S", INV, "Ibu Sari", "Hanya lihat rekening bersama", "Pemantau")]
    y = 150
    for i, (l, c, n, s, role) in enumerate(mem):
        o += avatar(56, y + 26, l, c, ONP if c == PRI else "#FFFFFF", 18, 15) + T(84, y + 21, n, 14, 700) + T(84, y + 39, s, 11.5, 500, MUTED)
        o += R(352 - tw(role, 11, 700) - 34, y + 13, tw(role, 11, 700) + 34, 26, 13, SURF2) + T(352 - tw(role, 11, 700) - 22, y + 30, role, 11, 700, INK) + I("chev_d", 336, y + 20, 12, MUTED)
        y += 56
    o += button(36, 324, 318, "Undang anggota", "soft", 40, "link", 13)
    o += section(408, "Rekening bersama")
    rows = [("bank", "Bank BCA", True), ("cash", "Dompet Tunai", True), ("wallet", "GoPay · Rina", False)]
    y = 422
    o += R(20, y, 350, len(rows) * 50 + 4, 20, SURF, LINE)
    for i, (ic, n, on) in enumerate(rows):
        yy = y + i * 50
        if i: o += L(56, yy + 2, 370, yy + 2, LINE)
        o += I(ic, 34, yy + 16, 20, MUTED) + T(64, yy + 31, n, 13.5, 600) + T(296, yy + 31, "Bersama" if on else "Pribadi", 11.5, 600, PRI if on else FAINT, "end") + toggle(312, yy + 13, on)
    o += section(612, "Aktivitas terbaru")
    acts = [("B", TRF, "Budi mencatat GoRide −Rp24.000", "10 menit lalu"), ("R", PRI, "Rina mengubah anggaran Makan Luar", "Kemarin, 21.14"), ("S", INV, "Ibu Sari bergabung sebagai Pemantau", "23 Nov")]
    y = 626
    for l, c, t, w_ in acts:
        o += avatar(36, y + 18, l, c, ONP if c == PRI else "#FFFFFF", 12, 11) + T(58, y + 15, t, 12.5, 600) + T(58, y + 32, w_, 11, 500, FAINT)
        y += 42
    o += home_ind()
    o += R(20, 758, 350, 50, 16, PRI_S) + I("bell", 34, 773, 20, PRI) + T(64, 788, "Beri tahu semua saat anggaran ≥ 90%", 12.5, 700, PRI) + toggle(318, 770, True)
    return o

# ======================================================================
def wrap(content, w=W, h=H, clip=True, bg=None):
    inner = f'<g clip-path="url(#scr)">{content}</g>' if clip else content
    font = f"<style>@import url('https://fonts.googleapis.com/css2?family={FONT_URL}&amp;display=swap');</style>"
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" font-family="{FONT}">'
            f'{font}{DEFS}{(R(0, 0, w, h, 0, bg) if bg else "")}{inner}</svg>')

def write(name, svg):
    with open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8") as f:
        f.write(svg)

rendered = []
for fname, title, fn in SCREENS:
    c = fn()
    rendered.append((fname, title, c))
    write(fname, wrap(c))

# ---------------- design system ----------------
def design_system():
    w, h = 1280, 980
    o = R(0, 0, w, h, 0, BG)
    o += T(56, 80, f"Vynance — Design System · {NAME}", 34, 800, INK, ls=-0.8) + T(56, 110, "Mobile first · 390 × 844 · grid 4 px · gutter 20 px", 15, 500, MUTED)
    o += T(56, 168, "WARNA", 12, 700, FAINT, ls=1.2)
    sw = [("Primary", PRI), ("Primary dark", PRI_D), ("Primary soft", PRI_S), ("Ink", INK), ("Muted", MUTED), ("Line", LINE), ("Field line", FIELD_LINE), ("Background", BG), ("Surface", SURF),
          ("Masuk", INC), ("Keluar", EXP), ("Transfer", TRF), ("Investasi", INV), ("Peringatan", WARN), ("Emas / aksen", GOLD)]
    for i, (n, c) in enumerate(sw):
        x = 56 + (i % 8) * 146; y = 184 + (i // 8) * 120
        o += R(x, y, 134, 64, 14, c, LINE) + T(x, y + 86, n, 13, 700) + T(x, y + 104, c, 12, 500, MUTED)
    o += T(56, 452, "TIPOGRAFI · Plus Jakarta Sans", 12, 700, FAINT, ls=1.2)
    ty = [("Angka hero 32/800", 32, 800, "Rp186.450.000"), ("Judul layar 22/800", 22, 800, "Anggaran"), ("Judul kartu 16/800", 16, 800, "Per kategori"),
          ("Isi 14/700", 14, 700, "Indomaret · Belanja Bulanan"), ("Keterangan 12/500", 12, 500, "Sisa Rp580.000 dari Rp4.000.000"), ("Label 11/700 caps", 11, 700, "HARI INI · KAMIS, 26 NOV")]
    y = 492
    for lab, s, wt, sample in ty:
        o += T(56, y, lab, 12, 600, MUTED) + T(260, y, sample, s, wt, INK, num=True)
        y += max(40, s + 18)
    # components
    o += T(720, 452, "KOMPONEN", 12, 700, FAINT, ls=1.2)
    o += button(720, 472, 240, "Simpan", "primary", 52, "check") + button(976, 472, 240, "Undang", "soft", 52, "link")
    o += button(720, 536, 240, "Kembali", "ghost") + button(976, 536, 240, "Masuk dengan email", "dark")
    x = 720
    for i, s in enumerate(["Semua", "Keluar", "Masuk"]):
        c, ww = chip(x, 608, s, i == 0); o += c; x += ww + 8
    x = 980
    for s, fg, bg in [("Aman", INC, INC_S), ("Pas", WARN, WARN_S), ("Melebihi", EXP, EXP_S)]:
        p, ww = pill(x, 614, s, fg, bg); o += p; x += ww + 8
    o += progress(720, 664, 496, .72, PRI, SURF2, 8) + progress(720, 684, 496, 1, EXP, EXP_S, 8)
    o += R(720, 708, 496, 64, 18, SURF, LINE) + f'<g transform="translate(12,0)">' + tx_row(718, "bag", EXP, EXP_S, "Indomaret", "Belanja Bulanan · BCA", "−Rp287.500", EXP, x=720, w=470) + "</g>"
    o += toggle(720, 792, True) + toggle(776, 792, False)
    o += icon_tile(860, 805, "in", INC, INC_S, 36, 17) + icon_tile(904, 805, "out", EXP, EXP_S, 36, 17) + icon_tile(948, 805, "transfer", TRF, TRF_S, 36, 17) + icon_tile(992, 805, "coins", INV, INV_S, 36, 17)
    o += ring(1090, 805, 26, .78, PRI, SURF2, 7) + T(1090, 811, "78", 15, 800, INK, "middle")
    o += T(720, 860, "Radius: kartu 20–24 · chip/tombol penuh · ikon tile 12–20", 12, 500, MUTED)
    o += T(720, 880, "Target sentuh ≥ 44 px · kontras teks ≥ 4.5:1 · angka tabular", 12, 500, MUTED)
    o += T(720, 900, "Warna arti tetap: hijau masuk · merah bata keluar · biru transfer · emas investasi", 12, 500, MUTED)
    ic = ["home", "list", "pie", "grid", "wallet", "card", "bank", "cash", "target", "trend", "repeat", "scan", "spark", "bell", "eye", "users", "school", "hand", "doc", "tag", "coins", "bag", "food", "car", "zap", "brief"]
    o += T(56, 830, "IKON (stroke 1.8)", 12, 700, FAINT, ls=1.2)
    for i, n in enumerate(ic):
        o += I(n, 56 + (i % 13) * 46, 846 + (i // 13) * 44, 24, INK)
    return wrap(o, w, h, clip=False)

write("00-design-system", design_system())

# ---------------- sitemap / flow ----------------
def sitemap():
    w, h = 1400, 1110
    o = R(0, 0, w, h, 0, BG)
    o += T(56, 80, "Vynance — Peta Layar & Alur Utama", 32, 800, INK, ls=-0.8)
    o += T(56, 110, "Navigasi bawah 5 slot: Beranda · Transaksi · [+] · Anggaran · Lainnya", 15, 500, MUTED)
    def box(x, y, w_, t, s=None, kind="n", h_=None):
        h_ = h_ or (62 if s else 44)
        fill, st, fg = {"n": (SURF, LINE, INK), "p": (PRI, None, ONP), "s": (PRI_S, None, PRI), "g": (SURF2, None, MUTED), "new": (WARN_S, WARN, WARN_D)}[kind]
        r = R(x, y, w_, h_, 14, fill, st, 1.4) + T(x + 16, y + 27, t, 14, 800, fg)
        if s: r += T(x + 16, y + 47, s, 11.5, 500, fg if kind == "p" else MUTED, op=.85 if kind == "p" else None)
        return r
    def arrow(x1, y1, x2, y2, col=FAINT, dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        return (f'<path d="M{x1},{y1} C{(x1 + x2) / 2},{y1} {(x1 + x2) / 2},{y2} {x2},{y2}" fill="none" stroke="{col}" stroke-width="1.6"{d}/>'
                f'<circle cx="{x2}" cy="{y2}" r="3.5" fill="{col}"/>')
    # entry column
    o += box(56, 170, 200, "Buka aplikasi", kind="g")
    o += box(56, 250, 200, "Masuk", "Google · Email · Demo", "n")
    o += box(56, 340, 200, "Onboarding", "Saldo awal · data bawaan", "n")
    o += box(56, 430, 200, "Ruang keluarga", "Buat / gabung (opsional)", "new")
    o += arrow(156, 214, 156, 250) .replace("C156,214 156,250", "L156,250") + arrow(156, 312, 156, 340).replace("C156,312 156,340", "L156,340") + arrow(156, 402, 156, 430).replace("C156,402 156,430", "L156,430")
    # nav tabs
    tabs = [(340, "Beranda", "Kekayaan · skor · anggaran"), (340 + 210, "Transaksi", "Daftar · filter · ekspor"), (340 + 420, "+ Catat", "Bottom sheet"), (340 + 630, "Anggaran", "Rencana bulanan"), (340 + 840, "Lainnya", "Semua modul")]
    for x, t, s in tabs:
        o += box(x, 170, 190, t, s, "p")
    o += arrow(256, 461, 340, 201)
    # children
    kids = {
        340: [("Skor kesehatan", "Rincian 4 pilar"), ("Notifikasi", "Anggaran ≥90%, tagihan H-3")],
        550: [("Detail transaksi", "Ubah · hapus · urungkan"), ("Cari & filter", "Tipe · tanggal · rekening")],
        760: [("Keluar / Masuk", "Kategori · rekening"), ("Transfer", "Sumber → tujuan"), ("Beli / Jual aset", "Update portofolio"), ("Scan struk", "Tekan lama + → tinjau")],
        970: [("Wizard anggaran", "50/30/20 · 60/20/20 · 70/10/20"), ("Bawa sisa bulan lalu", "Carry-over per kategori"), ("Detail kategori", "Realisasi vs alokasi")],
    }
    for x, items in kids.items():
        y = 270
        for t, s in items:
            o += box(x, y, 190, t, s, "s" if x == 760 else "n")
            o += f'<path d="M{x + 14},{y - 8 if y > 270 else 232} L{x + 14},{y}" stroke="{FAINT}" stroke-width="1.6"/>'
            y += 80
    more = [("Rekening", "6 tipe · arsip"), ("Target Tabungan", "Setor · status"), ("Investasi", "Jenis · aset · untung/rugi"), ("Langganan", "Otomatis · pengingat"),
            ("Dana Pendidikan", "Per anak · inflasi 12%"), ("Sumber Penghasilan", "Aktif vs pasif"), ("Zakat Maal", "Nisab 85 g · 2,5%"), ("Slip Gaji", "PDF → tren"),
            ("Kategori", "Anggaran · grup 50/30/20"), ("Keluarga", "Anggota · peran · bersama"), ("Asisten AI", "Tanya jawab data"), ("Pengaturan", "Privasi · tema · bahasa")]
    for i, (t, s) in enumerate(more):
        y = 270 + i * 54
        o += box(1180, y, 190, t, s, "new" if t == "Keluarga" else "n", 46).replace('y="' + str(y + 47) + '"', 'y="' + str(y + 40) + '"')
    # main flow strip
    fy = 970
    o += T(56, fy - 24, "ALUR HARIAN (target ≤ 10 detik)", 12, 700, FAINT, ls=1.2)
    steps = [("Tekan +", "dari layar mana pun"), ("Ketik jumlah", "keypad angka"), ("Pilih kategori", "chip sering dipakai"), ("Simpan", "default: hari ini, rekening terakhir"), ("Saldo & anggaran", "langsung terbarui"), ("Peringatan", "jika ≥90% anggaran")]
    for i, (t, s) in enumerate(steps):
        x = 56 + i * 220
        o += box(x, fy, 196, t, s, "p" if i in (0, 3) else "n")
        if i: o += f'<path d="M{x - 24},{fy + 31} L{x - 4},{fy + 31}" stroke="{PRI}" stroke-width="2"/><path d="M{x - 9},{fy + 26} L{x - 3},{fy + 31} L{x - 9},{fy + 36}" fill="none" stroke="{PRI}" stroke-width="2"/>'
    # legend
    ly = 1060
    for i, (k, lab) in enumerate([("p", "Tab utama / aksi"), ("s", "Varian catat"), ("n", "Layar"), ("new", "Baru di Vynance")]):
        x = 56 + i * 200
        fill, st = {"p": (PRI, None), "s": (PRI_S, None), "n": (SURF, LINE), "new": (WARN_S, WARN)}[k]
        o += R(x, ly, 22, 22, 6, fill, st) + T(x + 32, ly + 16, lab, 13, 600, MUTED)
    return wrap(o, w, h, clip=False)

write("01-sitemap-flow", sitemap())

# ---------------- board ----------------
cols = 6; gx = 56; gy = 120
bw = 120 + cols * (W + gx) - gx
rows_n = (len(rendered) + cols - 1) // cols
bh = 200 + rows_n * (H + gy)
b = R(0, 0, bw, bh, 0, BOARD)
b += T(60, 92, f"Vynance — Tema {NAME}", 44, 800, INK, ls=-1) + T(60, 130, f"{len(rendered)} layar · 390 × 844 · {DESC}", 18, 500, MUTED)
for i, (fname, title, c) in enumerate(rendered):
    x = 60 + (i % cols) * (W + gx); y = 200 + (i // cols) * (H + gy)
    b += T(x, y - 20, f"{fname.split('-')[0]}  {title}", 16, 800, INK)
    b += f'<g transform="translate({x},{y})"><rect width="{W}" height="{H}" rx="44" fill="{BG}" filter="url(#sh2)"/><g clip-path="url(#scr)">{c}</g><rect width="{W}" height="{H}" rx="44" fill="none" stroke="{LINE}" stroke-width="1"/></g>'
write("vynance-board", wrap(b, bw, bh, clip=False))
print("ok", len(rendered), "screens")
