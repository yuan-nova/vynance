import { logger } from "./logger"

// Pengirim email transaksional (OTP). Penyedia: Resend (TSD §14 #1).
// Tanpa EMAIL_API_KEY (hanya development), kode dicetak ke log container api supaya bisa login lokal.

type MailerConfig = { from: string; apiKey?: string; isProduction: boolean }

export function createMailer(cfg: MailerConfig): { sendOtp: (email: string, otp: string) => Promise<void> } {
  return {
    async sendOtp(email, otp) {
      const subject = `Kode masuk Vynance: ${otp}`
      const text = `Kode masuk Vynance kamu: ${otp}\n\nKode berlaku 5 menit. Abaikan email ini bila kamu tidak meminta kode.`
      if (!cfg.apiKey) {
        if (cfg.isProduction) throw new Error("EMAIL_API_KEY belum diatur")
        // Hanya development: tampilkan kode di log supaya bisa login tanpa penyedia email.
        console.log(`[dev-mail] OTP untuk ${email}: ${otp}`)
        return
      }
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${cfg.apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ from: cfg.from, to: [email], subject, text }),
      })
      if (!res.ok) {
        logger.error("mailer gagal", { status: res.status })
        throw new Error(`Pengiriman email gagal (${res.status})`)
      }
    },
  }
}
