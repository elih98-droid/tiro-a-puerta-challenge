/**
 * lib/email/templates/suspicious-activity.ts
 *
 * Email sent to admins when suspicious activity is detected.
 * Possible triggers: same IP used by multiple accounts, rapid pick changes.
 */

interface SuspiciousActivityEmailParams {
  alertType: 'multi_account_ip' | 'rapid_pick_changes';
  details: string;     // Human-readable description of what was detected
  usernames: string[]; // Usernames involved
  ip: string;
  detectedAt: string;  // ISO timestamp
  adminUrl: string;    // URL to the admin panel
}

export function suspiciousActivityEmailTemplate(params: SuspiciousActivityEmailParams): {
  subject: string;
  html: string;
} {
  const { alertType, details, usernames, ip, detectedAt, adminUrl } = params;

  const alertLabel = alertType === 'multi_account_ip'
    ? 'POSIBLE MULTI-CUENTA'
    : 'CAMBIOS RÁPIDOS DE PICK';

  const subject = `⚠️ Alerta: ${alertLabel} — Tiro a Puerta`;

  const usernameList = usernames.map((u) => `@${u}`).join(', ');

  const date = new Date(detectedAt);
  const timeStr = date.toLocaleTimeString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const dateStr = date.toLocaleDateString('es-MX', {
    timeZone: 'America/Mexico_City',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0B0D18;font-family:'Arial',sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0D18;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background-color:#181C36;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1B2566,#2A398D);padding:28px 32px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.3);">
              <p style="margin:0;font-size:11px;letter-spacing:3px;color:#C9A84C;font-weight:700;text-transform:uppercase;">TIRO A PUERTA</p>
              <p style="margin:4px 0 0;font-size:9px;letter-spacing:2px;color:rgba(201,168,76,0.7);text-transform:uppercase;">CHALLENGE · MEX · USA · CAN 2026</p>
            </td>
          </tr>

          <!-- Red alert banner -->
          <tr>
            <td style="background-color:#E61D25;padding:14px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#fff;letter-spacing:2px;text-transform:uppercase;">⚠️ ${alertLabel}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">

              <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.85);line-height:1.6;">
                ${details}
              </p>

              <!-- Details box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(230,29,37,0.12);border:1px solid rgba(230,29,37,0.3);border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 10px;font-size:10px;letter-spacing:2px;color:#E61D25;font-weight:700;text-transform:uppercase;">Detalles</p>
                    <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.7);">
                      <strong style="color:#fff;">Usuarios:</strong> ${usernameList}
                    </p>
                    <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.7);">
                      <strong style="color:#fff;">IP:</strong> ${ip}
                    </p>
                    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);">
                      <strong style="color:#fff;">Detectado:</strong> ${dateStr} · ${timeStr} CDMX
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 28px;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;">
                Esta alerta puede ser un falso positivo (misma red WiFi, oficina, etc.). Verifica manualmente antes de tomar acción.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${adminUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(180deg,#2A398D,#1B2566);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;border:1.5px solid #C9A84C;letter-spacing:1px;">
                      VER PANEL DE ADMIN
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);">
                Alerta automática del sistema anti-trampa. No respondas a este correo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  return { subject, html };
}
