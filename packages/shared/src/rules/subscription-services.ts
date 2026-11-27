import type { IconName } from "../icons"

// Pengenalan 50+ layanan langganan dari nama (PB-05 langkah 1). Ikon dari registri, warna dari tone tema
// (bukan hex merek) supaya tetap lolos kontras di semua tema.

type ServiceTone = "pri" | "inc" | "exp" | "trf" | "inv" | "auto" | "warn"
type ServiceEntry = { key: string; label: string; match: RegExp; icon: IconName; tone: ServiceTone }

const s = (key: string, label: string, match: RegExp, icon: IconName, tone: ServiceTone): ServiceEntry => ({
  key,
  label,
  match,
  icon,
  tone,
})

export const SUBSCRIPTION_SERVICES: readonly ServiceEntry[] = [
  s("netflix", "Netflix", /netflix/i, "img", "exp"),
  s("spotify", "Spotify", /spotify/i, "mic", "inc"),
  s("youtube", "YouTube Premium", /youtube|yt premium/i, "img", "exp"),
  s("disney", "Disney+ Hotstar", /disney|hotstar/i, "img", "trf"),
  s("vidio", "Vidio", /vidio/i, "img", "exp"),
  s("viu", "Viu", /\bviu\b/i, "img", "warn"),
  s("wetv", "WeTV", /wetv/i, "img", "trf"),
  s("iqiyi", "iQIYI", /iqiyi/i, "img", "inc"),
  s("primevideo", "Prime Video", /prime video|amazon prime/i, "img", "trf"),
  s("appletv", "Apple TV+", /apple tv/i, "img", "pri"),
  s("applemusic", "Apple Music", /apple music/i, "mic", "exp"),
  s("icloud", "iCloud+", /icloud/i, "link", "trf"),
  s("appleone", "Apple One", /apple one/i, "link", "pri"),
  s("googleone", "Google One", /google one|google drive/i, "link", "trf"),
  s("youtubemusic", "YouTube Music", /youtube music/i, "mic", "exp"),
  s("joox", "JOOX", /joox/i, "mic", "inc"),
  s("resso", "Resso", /resso/i, "mic", "auto"),
  s("tidal", "Tidal", /tidal/i, "mic", "pri"),
  s("deezer", "Deezer", /deezer/i, "mic", "auto"),
  s("chatgpt", "ChatGPT Plus", /chatgpt|openai/i, "spark", "inc"),
  s("claude", "Claude Pro", /claude|anthropic/i, "spark", "warn"),
  s("gemini", "Gemini Advanced", /gemini/i, "spark", "trf"),
  s("copilot", "GitHub Copilot", /copilot/i, "spark", "pri"),
  s("github", "GitHub", /github/i, "link", "pri"),
  s("microsoft365", "Microsoft 365", /microsoft 365|office 365|m365/i, "doc", "trf"),
  s("canva", "Canva Pro", /canva/i, "img", "auto"),
  s("adobe", "Adobe Creative Cloud", /adobe|photoshop|lightroom/i, "img", "exp"),
  s("figma", "Figma", /figma/i, "img", "auto"),
  s("notion", "Notion", /notion/i, "doc", "pri"),
  s("dropbox", "Dropbox", /dropbox/i, "link", "trf"),
  s("zoom", "Zoom", /zoom/i, "users", "trf"),
  s("grammarly", "Grammarly", /grammarly/i, "edit", "inc"),
  s("duolingo", "Duolingo", /duolingo/i, "school", "inc"),
  s("ruangguru", "Ruangguru", /ruang ?guru/i, "school", "trf"),
  s("zenius", "Zenius", /zenius/i, "school", "auto"),
  s("coursera", "Coursera", /coursera/i, "school", "trf"),
  s("linkedin", "LinkedIn Premium", /linkedin/i, "brief", "trf"),
  s("xbox", "Xbox Game Pass", /xbox|game pass/i, "zap", "inc"),
  s("playstation", "PlayStation Plus", /playstation|ps plus/i, "zap", "trf"),
  s("nintendo", "Nintendo Switch Online", /nintendo/i, "zap", "exp"),
  s("steam", "Steam", /steam/i, "zap", "pri"),
  s("indihome", "IndiHome", /indihome/i, "wifi", "exp"),
  s("biznet", "Biznet", /biznet/i, "wifi", "trf"),
  s("firstmedia", "First Media", /first media/i, "wifi", "exp"),
  s("myrepublic", "MyRepublic", /myrepublic/i, "wifi", "auto"),
  s("iconnet", "ICONNET", /iconnet/i, "wifi", "trf"),
  s("xlhome", "XL Home", /xl ?home/i, "wifi", "trf"),
  s("telkomsel", "Telkomsel", /telkomsel|halo/i, "wifi", "exp"),
  s("xl", "XL Axiata", /\bxl\b|axis/i, "wifi", "trf"),
  s("indosat", "Indosat IM3", /indosat|im3/i, "wifi", "warn"),
  s("smartfren", "Smartfren", /smartfren/i, "wifi", "exp"),
  s("pln", "PLN", /\bpln\b|listrik/i, "zap", "warn"),
  s("pdam", "PDAM", /pdam/i, "zap", "trf"),
  s("bpjs", "BPJS Kesehatan", /bpjs/i, "heart", "inc"),
  s("asuransi", "Asuransi", /asuransi|insurance/i, "shield", "trf"),
  s("gym", "Gym / Fitness", /gym|fitness|celebrity fitness|fit hub/i, "heart", "exp"),
  s("gopay", "GoPay Plus / GoTo", /gopay|goto plus|gojek plus/i, "wallet", "inc"),
  s("grab", "GrabUnlimited", /grab/i, "car", "inc"),
  s("shopee", "Shopee VIP", /shopee/i, "bag", "warn"),
  s("tokopedia", "Tokopedia Plus", /tokopedia/i, "bag", "inc"),
  s("kompas", "Kompas.id", /kompas/i, "doc", "trf"),
  s("tempo", "Tempo", /tempo/i, "doc", "exp"),
]

/** Kenali layanan dari nama (pertama yang cocok). null bila tidak dikenali → ikon umum. */
export function recognizeService(name: string): ServiceEntry | null {
  for (const e of SUBSCRIPTION_SERVICES) {
    if (e.match.test(name)) return e
  }
  return null
}
