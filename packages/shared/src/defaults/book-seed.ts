import type { WalletType } from "../enums/wallet"
import type { BudgetGroup, CategoryIcon } from "../schemas/category"

// Data bawaan setiap buku baru (BR-46, PB-01, TSD §6.5). Dipakai BE (isi buku) dan FE (pratinjau onboarding).

export type SeedWallet = { name: string; type: WalletType; icon: string; creditLimit: bigint | null }
export type SeedCategory = { name: string; icon: CategoryIcon; budgetGroup: BudgetGroup | null }
export type SeedInvestmentType = { name: string; icon: string }

export const DEFAULT_BOOK_NAME = "Pribadi"

export const SEED_WALLETS: readonly SeedWallet[] = [
  { name: "Dompet Tunai", type: "cash", icon: "cash", creditLimit: null },
  { name: "Bank", type: "bank", icon: "bank", creditLimit: null },
  { name: "Kartu Kredit", type: "credit_card", icon: "card", creditLimit: 10_000_000n },
]

export const SEED_EXPENSE_CATEGORIES: readonly SeedCategory[] = [
  { name: "Makan & Minum", icon: "food", budgetGroup: "needs" },
  { name: "Belanja Bulanan", icon: "bag", budgetGroup: "needs" },
  { name: "Transportasi", icon: "car", budgetGroup: "needs" },
  { name: "Listrik & Air", icon: "zap", budgetGroup: "needs" },
  { name: "Kesehatan", icon: "heart", budgetGroup: "needs" },
  { name: "Pendidikan", icon: "school", budgetGroup: "needs" },
  { name: "Zakat & Infaq", icon: "moon", budgetGroup: "needs" },
  { name: "Langganan", icon: "repeat", budgetGroup: "wants" },
  { name: "Hiburan", icon: "tag", budgetGroup: "wants" },
  { name: "Tabungan", icon: "coins", budgetGroup: "savings" },
]

export const SEED_INCOME_CATEGORIES: readonly SeedCategory[] = [
  { name: "Gaji", icon: "brief", budgetGroup: null },
  { name: "Bonus", icon: "coins", budgetGroup: null },
  { name: "Usaha", icon: "trend", budgetGroup: null },
  { name: "Pemasukan lain", icon: "tag", budgetGroup: null },
]

export const SEED_INVESTMENT_TYPES: readonly SeedInvestmentType[] = [
  { name: "Emas", icon: "coins" },
  { name: "Reksa Dana", icon: "trend" },
  { name: "Saham", icon: "trend" },
]
