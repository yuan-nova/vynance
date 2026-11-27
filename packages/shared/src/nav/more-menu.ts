import type { IconName } from "../icons"

// Isi menu Lainnya (DS-NAV-03, BRD §12.2). Grup dan urutan tetap. `path: null` = belum rilis ("Segera hadir").

export type MoreMenuItem = { key: string; label: string; icon: IconName; path: string | null }
export type MoreMenuGroup = { key: "money" | "planning" | "data"; title: string; items: MoreMenuItem[] }

export const MORE_MENU: MoreMenuGroup[] = [
  {
    key: "money",
    title: "Uang",
    items: [
      { key: "wallets", label: "Rekening", icon: "bank", path: "/lainnya/rekening" },
      { key: "investments", label: "Investasi", icon: "coins", path: "/lainnya/investasi" },
      { key: "subscriptions", label: "Langganan", icon: "repeat", path: "/lainnya/langganan" },
      { key: "incomes", label: "Sumber penghasilan", icon: "brief", path: "/lainnya/penghasilan" },
      { key: "payslips", label: "Slip gaji", icon: "doc", path: null },
    ],
  },
  {
    key: "planning",
    title: "Perencanaan",
    items: [
      { key: "goals", label: "Target tabungan", icon: "target", path: "/lainnya/target" },
      { key: "zakat", label: "Zakat", icon: "moon", path: "/lainnya/zakat" },
      { key: "education", label: "Dana pendidikan", icon: "school", path: "/lainnya/pendidikan" },
      { key: "advisor", label: "AI advisor", icon: "spark", path: "/lainnya/asisten" },
    ],
  },
  {
    key: "data",
    title: "Data",
    items: [
      { key: "categories", label: "Kategori", icon: "tag", path: "/lainnya/kategori" },
      { key: "books", label: "Buku", icon: "book", path: "/lainnya/buku" },
      { key: "settings", label: "Pengaturan", icon: "sliders", path: "/lainnya/pengaturan" },
    ],
  },
]
