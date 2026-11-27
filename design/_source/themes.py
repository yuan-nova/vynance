"""Theme tokens for the Vynance SVG generator.

Each theme overrides the base (Hutan). Keys:
  BG/SURF/SURF2/SURF3  background & surfaces      INK/MUTED/FAINT  text  LINE  divider  FIELD_LINE  input border (>=3:1)
  PRI/PRI_D/PRI_S/PRI_T primary, dark, soft, tint  ONP  text/icon on primary
  ON_INK  text on ink-colored chips/bubbles        HERO1/HERO2/HERO_FG/HERO_TINT/HERO_NEG  hero card
  GOLD  accent on hero                              INC/EXP/TRF/INV/WARN (+_S soft)  semantic colors
  WARN_D/EXP_D  dark text on soft warn/expense      AUTO/AUTO_S  "Otomatis" badge   BOARD  board bg
"""

BASE = dict(
    NAME="Hutan", DESC="Hijau hutan + emas. Tenang, terpercaya (tema awal).",
    BG="#F5F4EF", SURF="#FFFFFF", SURF2="#EDEBE4", SURF3="#E4E1D8",
    INK="#15201C", MUTED="#5C6863", FAINT="#6D7672", LINE="#E3E0D7", FIELD_LINE="#828B87",
    PRI="#1C5D4C", PRI_D="#123F34", PRI_S="#DDEBE4", PRI_T="#B9D6C9", ONP="#FFFFFF", ON_INK="#FFFFFF",
    HERO1="#21705C", HERO2="#123F34", HERO_FG="#FFFFFF", HERO_TINT="#2F7F69", HERO_NEG="#F6E1D9",
    GOLD="#E0B04F",
    INC="#1D7650", INC_S="#DCF1E5", EXP="#C0453A", EXP_S="#F8E1DE", TRF="#3967A6", TRF_S="#E0E9F5",
    INV="#8A601A", INV_S="#F6EBD3", WARN="#A3660B", WARN_S="#FBEFD2", WARN_D="#7A5208", EXP_D="#8E342C",
    AUTO="#6B4FA0", AUTO_S="#ECE6F6", BOARD="#E9E7E0",
    FONT="'Plus Jakarta Sans','Inter',system-ui,-apple-system,'Segoe UI',sans-serif", FONT_URL="Plus+Jakarta+Sans:wght@400;500;600;700;800",
)

THEMES = {
    "hutan": {},
    "samudra": dict(
        NAME="Samudra", DESC="Biru laut + oranye senja. Bersih, profesional, mirip aplikasi bank.",
        BG="#F2F5F9", SURF="#FFFFFF", SURF2="#E7ECF3", SURF3="#D9E0EA",
        INK="#0F1B2D", MUTED="#55627A", FAINT="#67758A", LINE="#DCE3EC", FIELD_LINE="#7D8BA0",
        PRI="#1F4E8C", PRI_D="#12305A", PRI_S="#DFE8F5", PRI_T="#B3C9E8",
        HERO1="#2C66B0", HERO2="#132F57", HERO_TINT="#3D74BC", HERO_NEG="#FFE2E2",
        GOLD="#F4A259",
        INC="#167558", INC_S="#DAF1EA", EXP="#D23E30", EXP_S="#FBE3E0", TRF="#5A55C9", TRF_S="#E6E5FA",
        INV="#905E12", INV_S="#F8EBD5", AUTO="#8A3FA0", AUTO_S="#F2E4F6", WARN="#A3660B", BOARD="#E4E9F0",
        FONT="'Manrope','Inter',system-ui,sans-serif", FONT_URL="Manrope:wght@400;500;600;700;800",
    ),
    "terakota": dict(
        NAME="Terakota", DESC="Bata hangat + krem + zaitun. Hangat, kekeluargaan, membumi.",
        BG="#FAF4EC", SURF="#FFFDF9", SURF2="#F1E8DB", SURF3="#E6D9C7",
        INK="#2B1C14", MUTED="#6F5C50", FAINT="#816F62", LINE="#EADCCB", FIELD_LINE="#988679",
        PRI="#A44828", PRI_D="#6E2E17", PRI_S="#F6E1D6", PRI_T="#F2C4AE",
        HERO1="#964A25", HERO2="#6E2E17", HERO_TINT="#CC7350", HERO_NEG="#FFD3C4",
        GOLD="#F2CD72",
        INC="#4B7232", INC_S="#E6EFD9", EXP="#A3243A", EXP_S="#F7DDE1", TRF="#2E6A8F", TRF_S="#DDEBF3",
        INV="#8E5D10", INV_S="#F5E8CF", WARN="#A2650A", WARN_S="#FAEBCB", AUTO="#7A4E9C", AUTO_S="#EEE4F5",
        BOARD="#EFE6DA",
        FONT="'DM Sans','Inter',system-ui,sans-serif", FONT_URL="DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800",
    ),
    "anggrek": dict(
        NAME="Anggrek", DESC="Ungu plum + aksen mint. Modern, ramah anak muda.",
        BG="#F7F5FB", SURF="#FFFFFF", SURF2="#EEEAF6", SURF3="#E1DAEE",
        INK="#1D1530", MUTED="#625A74", FAINT="#777089", LINE="#E5DFF0", FIELD_LINE="#8E87A0",
        PRI="#5B3F99", PRI_D="#2E1D57", PRI_S="#ECE5F8", PRI_T="#CDBDF0",
        HERO1="#7350BC", HERO2="#2C1B55", HERO_TINT="#8263C6", HERO_NEG="#FFDEE1",
        GOLD="#7FE3BC",
        INC="#137751", INC_S="#D9F2E7", EXP="#CE3F58", EXP_S="#FBE0E5", TRF="#286AA4", TRF_S="#DEEBF8",
        INV="#8E5F14", INV_S="#F8EBD3", AUTO="#A83E7A", AUTO_S="#F7E1EE", WARN="#A3660B", BOARD="#ECE8F3",
        FONT="'Outfit','Inter',system-ui,sans-serif", FONT_URL="Outfit:wght@400;500;600;700;800",
    ),
    "malam": dict(
        NAME="Malam", DESC="Mode gelap: arang + mint + emas. Nyaman di malam hari, hemat baterai OLED.",
        BG="#0E1412", SURF="#161E1B", SURF2="#1F2925", SURF3="#2C3833",
        INK="#E8F0EC", MUTED="#9DABA5", FAINT="#7B8A83", LINE="#26322D", FIELD_LINE="#616D68",
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
        INK="#111111", MUTED="#5C5C57", FAINT="#74746D", LINE="#E2E2D9", FIELD_LINE="#898982",
        PRI="#141414", PRI_D="#050505", PRI_S="#EAF8B8", PRI_T="#D6FF3D", ONP="#D6FF3D",
        HERO1="#232323", HERO2="#050505", HERO_TINT="#333333", HERO_NEG="#FF9C8F",
        GOLD="#D6FF3D",
        INC="#147843", INC_S="#DCF2E4", EXP="#DB311F", EXP_S="#FCE2DE", TRF="#2B59D6", TRF_S="#E1E8FB",
        INV="#8F5C00", INV_S="#F7EBD0", AUTO="#7A3FD0", AUTO_S="#EEE5FB", WARN="#A3660B", BOARD="#E6E6DF",
        FONT="'Space Grotesk','Inter',system-ui,sans-serif", FONT_URL="Space+Grotesk:wght@400;500;600;700",
    ),
}


def get(key):
    t = dict(BASE)
    t.update(THEMES[key])
    return t
