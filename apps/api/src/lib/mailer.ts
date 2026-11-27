import { logger } from "./logger"

// Pengirim email transaksional (OTP, pengingat). Penyedia: Resend (TSD §14 #1).
// Tanpa EMAIL_API_KEY (hanya development), isi email dicetak ke log container supaya bisa diuji lokal.

type MailerConfig = { from: string; apiKey?: string; isProduction: boolean }
type Mailer = {
  send: (email: string, subject: string, text: string) => Promise<void>
  sendOtp: (email: string, otp: string) => Promise<void>
}

export function createMailer(cfg: MailerConfig): Mailer {
  const send = async (email: string, subject: string, text: string): Promise<void> => {
    if (!cfg.apiKey) {
      if (cfg.isProduction) throw new Error("EMAIL_API_KEY belum diatur")
      // Hanya development: tampilkan isi email di log supaya alur bisa diuji tanpa penyedia email.
      console.log(`[dev-mail] untuk ${email}: ${subject}`)
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
  }
  return {
    send,
    async sendOtp(email, otp) {
      if (!cfg.apiKey && !cfg.isProduction) {
        console.log(`[dev-mail] OTP untuk ${email}: ${otp}`)
        return
      }
      await send(
        email,
        `Kode masuk Vynance: ${otp}`,
        `Kode masuk Vynance kamu: ${otp}\n\nKode berlaku 5 menit. Abaikan email ini bila kamu tidak meminta kode.`,
      )
    },
  }
}
