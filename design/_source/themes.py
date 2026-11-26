"""Theme tokens for the Vynance SVG generator.

Each theme overrides the base (Hutan). Keys:
  BG/SURF/SURF2/SURF3  background & surfaces      INK/MUTED/FAINT/LINE  text & lines
  PRI/PRI_D/PRI_S/PRI_T primary, dark, soft, tint  ONP  text/icon on primary
  ON_INK  text on ink-colored chips/bubbles        HERO1/HERO2/HERO_FG/HERO_TINT/HERO_NEG  hero card
  GOLD  accent on hero                              INC/EXP/TRF/INV/WARN (+_S soft)  semantic colors
  WARN_D/EXP_D  dark text on soft warn/expense      AUTO/AUTO_S  "Otomatis" badge   BOARD  board bg
"""

BASE = dict(
    NAME="Hutan", DESC="Hijau hutan + emas. Tenang, terpercaya (tema awal).",
    BG="#F5F4EF", SURF="#FFFFFF", SURF2="#EDEBE4", SURF3="#E4E1D8",
    INK="#15201C", MUTED="#5C6863", FAINT="#8A938F", LINE="#E3E0D7",
    PRI="#1C5D4C", PRI_D="#123F34", PRI_S="#DDEBE4", PRI_T="#B9D6C9", ONP="#FFFFFF", ON_INK="#FFFFFF",
    HERO1="#21705C", HERO2="#123F34", HERO_FG="#FFFFFF", HERO_TINT="#2F7F69", HERO_NEG="#F4B9B1",
    GOLD="#E0B04F",
    INC="#1E8A5A", INC_S="#DCF1E5", EXP="#C0453A", EXP_S="#F8E1DE", TRF="#3A68A8", TRF_S="#E0E9F5",
    INV="#A8741A", INV_S="#F6EBD3", WARN="#B9790B", WARN_S="#FBEFD2", WARN_D="#7A5208", EXP_D="#8E342C",
    AUTO="#6B4FA0", AUTO_S="#ECE6F6", BOARD="#E9E7E0",
    FONT="'Plus Jakarta Sans','Inter',system-ui,-apple-system,'Segoe UI',sans-serif", FONT_URL="Plus+Jakarta+Sans:wght@400;500;600;700;800",
)

THEMES = {
    "hutan": {},
    "samudra": dict(
        NAME="Samudra", DESC="Biru laut + oranye senja. Bersih, profesional, mirip aplikasi bank.",
        BG="#F2F5F9", SURF="#FFFFFF", SURF2="#E7ECF3", SURF3="#D9E0EA",
        INK="#0F1B2D", MUTED="#55627A", FAINT="#8593A8", LINE="#DCE3EC",
        PRI="#1F4E8C", PRI_D="#12305A", PRI_S="#DFE8F5", PRI_T="#B3C9E8",
        HERO1="#2C66B0", HERO2="#132F57", HERO_TINT="#3D74BC", HERO_NEG="#FFC2B5",
        GOLD="#F4A259",
        INC="#16876A", INC_S="#DAF1EA", EXP="#D2483A", EXP_S="#FBE3E0", TRF="#5A55C9", TRF_S="#E6E5FA",
        INV="#B26F12", INV_S="#F8EBD5", AUTO="#8A3FA0", AUTO_S="#F2E4F6", BOARD="#E4E9F0",
        FONT="'Manrope','Inter',system-ui,sans-serif", FONT_URL="Manrope:wght@400;500;600;700;800",
    ),
    "terakota": dict(
        NAME="Terakota", DESC="Bata hangat + krem + zaitun. Hangat, kekeluargaan, membumi.",
        BG="#FAF4EC", SURF="#FFFDF9", SURF2="#F1E8DB", SURF3="#E6D9C7",
        INK="#2B1C14", MUTED="#6F5C50", FAINT="#9C8A7D", LINE="#EADCCB",
        PRI="#B04E2C", PRI_D="#6E2E17", PRI_S="#F6E1D6", PRI_T="#F2C4AE",
        HERO1="#C2603A", HERO2="#6E2E17", HERO_TINT="#CC7350", HERO_NEG="#FFD3C4",
        GOLD="#F2CD72",
        INC="#4F7A36", INC_S="#E6EFD9", EXP="#A3243A", EXP_S="#F7DDE1", TRF="#2E6A8F", TRF_S="#DDEBF3",
        INV="#986410", INV_S="#F5E8CF", WARN="#B4740A", WARN_S="#FAEBCB", AUTO="#7A4E9C", AUTO_S="#EEE4F5",
        BOARD="#EFE6DA",
        FONT="'DM Sans','Inter',system-ui,sans-serif", FONT_URL="DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800",
    ),
    "anggrek": dict(
        NAME="Anggrek", DESC="Ungu plum + aksen mint. Modern, ramah anak muda.",
        BG="#F7F5FB", SURF="#FFFFFF", SURF2="#EEEAF6", SURF3="#E1DAEE",
        INK="#1D1530", MUTED="#625A74", FAINT="#9089A2", LINE="#E5DFF0",
        PRI="#5B3F99", PRI_D="#2E1D57", PRI_S="#ECE5F8", PRI_T="#CDBDF0",
        HERO1="#7350BC", HERO2="#2C1B55", HERO_TINT="#8263C6", HERO_NEG="#FFC3CF",
        GOLD="#7FE3BC",
        INC="#13875C", INC_S="#D9F2E7", EXP="#D0435C", EXP_S="#FBE0E5", TRF="#2D78C0", TRF_S="#DEEBF8",
        INV="#B47414", INV_S="#F8EBD3", AUTO="#B0427E", AUTO_S="#F7E1EE", BOARD="#ECE8F3",
        FONT="'Outfit','Inter',system-ui,sans-serif", FONT_URL="Outfit:wght@400;500;600;700;800",
    ),
    "malam": dict(
        NAME="Malam", DESC="Mode gelap: arang + mint + emas. Nyaman di malam hari, hemat baterai OLED.",
        BG="#0E1412", SURF="#161E1B", SURF2="#1F2925", SURF3="#2C3833",
        INK="#E8F0EC", MUTED="#9DABA5", FAINT="#6F7E77", LINE="#26322D",
        PRI="#4FD1A1", PRI_D="#0B3B2C", PRI_S="#163A2F", PRI_T="#9FE6CB", ONP="#05231A", ON_INK="#0E1412",
        HERO1="#1D5443", HERO2="#0E2620", HERO_TINT="#2B6A57", HERO_NEG="#FFB0A6",
        GOLD="#F2C46B",
        INC="#5AD69A", INC_S="#15332A", EXP="#FF7B6C", EXP_S="#3A201D", TRF="#86AEFF", TRF_S="#1C2742",
        INV="#F0B45A", INV_S="#3A2D15", WARN="#F5B83D", WARN_S="#3A3013", WARN_D="#F6D58C", EXP_D="#FFB7AD",
        AUTO="#C6AAFF", AUTO_S="#2B2343", BOARD="#070B0A",
    ),
    "citrus": dict(
        NAME="Citrus", DESC="Hitam + hijau limau. Tegas, berani, gaya fintech baru.",
        BG="#F4F4EF", SURF="#FFFFFF", SURF2="#EBEBE4", SURF3="#DCDCD3",
        INK="#111111", MUTED="#5C5C57", FAINT="#8C8C85", LINE="#E2E2D9",
        PRI="#141414", PRI_D="#050505", PRI_S="#EAF8B8", PRI_T="#D6FF3D", ONP="#D6FF3D",
        HERO1="#232323", HERO2="#050505", HERO_TINT="#333333", HERO_NEG="#FF9C8F",
        GOLD="#D6FF3D",
        INC="#14884B", INC_S="#DCF2E4", EXP="#E0402D", EXP_S="#FCE2DE", TRF="#2B59D6", TRF_S="#E1E8FB",
        INV="#B07200", INV_S="#F7EBD0", AUTO="#7A3FD0", AUTO_S="#EEE5FB", BOARD="#E6E6DF",
        FONT="'Space Grotesk','Inter',system-ui,sans-serif", FONT_URL="Space+Grotesk:wght@400;500;600;700",
    ),
}


def get(key):
    t = dict(BASE)
    t.update(THEMES[key])
    return t
