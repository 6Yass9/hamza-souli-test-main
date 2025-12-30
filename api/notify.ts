import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * WhatsApp Business Cloud API helper.
 *
 * Required env vars (Vercel Project Settings → Environment Variables):
 * - WHATSAPP_TOKEN: Permanent access token (or system user token)
 * - WHATSAPP_PHONE_NUMBER_ID: The "phone_number_id" from WhatsApp Cloud API
 * - WHATSAPP_ADMIN_PHONE: Admin WhatsApp number in international format, e.g. +216XXXXXXXX
 *
 * Notes:
 * - Sending the first message to a user who has NOT messaged your business in the last 24h
 *   usually requires an approved TEMPLATE message.
 * - This endpoint sends simple text messages (works inside the 24h window).
 */

type NotifyBody = {
  date: string;
  name: string;
  phone: string;
  // optional: allow passing appointment type
  type?: string;
};

const normalizeE164ish = (raw: string) => {
  // WhatsApp Cloud API expects the number without '+' (e.g. 216xxxxxxxx)
  const cleaned = String(raw || '').replace(/\s+/g, '');
  return cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
};

const formatDateFr = (yyyyMmDd: string) => {
  // Expected input: YYYY-MM-DD
  try {
    const [y, m, d] = yyyyMmDd.split('-').map((v) => Number(v));
    if (!y || !m || !d) return yyyyMmDd;
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return yyyyMmDd;
  }
};

async function sendWhatsAppText(toE164ish: string, text: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error('Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID');
  }

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizeE164ish(toE164ish),
      type: 'text',
      text: { preview_url: false, body: text }
    })
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`WhatsApp send failed (${resp.status}): ${detail}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date, name, phone, type }: NotifyBody = req.body;

    if (!date || !name || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;
    const niceDate = formatDateFr(date);

    // a) Auto reply to client (French)
    const clientMsg =
      `Merci pour votre patience. ✅\n` +
      `Votre demande de consultation pour le ${niceDate} a bien été reçue.\n` +
      `Nous reviendrons vers vous très bientôt pour confirmer l’horaire.\n\n` +
      `— Souli Studio`;

    // b) Admin notification (French)
    const adminMsg =
      `📅 Nouvelle demande de rendez-vous à valider\n` +
      `• Date : ${niceDate}\n` +
      `• Nom : ${name}\n` +
      `• Téléphone : ${phone}` +
      (type ? `\n• Type : ${type}` : '');

    // Fire-and-forget is risky in serverless; we'll attempt both and continue if one fails.
    const results: { client?: string; admin?: string } = {};

    // Send client reply
    try {
      await sendWhatsAppText(phone, clientMsg);
      results.client = 'sent';
    } catch (e) {
      console.error('WhatsApp client message failed:', e);
      results.client = 'failed';
    }

    // Send admin notification
    if (adminPhone) {
      try {
        await sendWhatsAppText(adminPhone, adminMsg);
        results.admin = 'sent';
      } catch (e) {
        console.error('WhatsApp admin message failed:', e);
        results.admin = 'failed';
      }
    } else {
      results.admin = 'skipped (missing WHATSAPP_ADMIN_PHONE)';
    }

    return res.status(200).json({ success: true, results });
  } catch (err) {
    console.error('Notify error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
