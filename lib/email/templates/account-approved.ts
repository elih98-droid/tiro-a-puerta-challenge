/**
 * lib/email/templates/account-approved.ts
 *
 * Email sent to a user when the admin approves their account.
 * Reference: ROADMAP §2.5
 *
 * Why inline styles?
 *   Email clients (Gmail, Outlook, Apple Mail) strip <style> blocks and CSS
 *   variables. Everything must be written with style="" attributes using
 *   hard-coded hex values.
 */

interface AccountApprovedEmailParams {
  username: string;
  loginUrl: string; // Full URL to /login
}

export function accountApprovedEmailTemplate(params: AccountApprovedEmailParams): {
  subject: string;
  html: string;
} {
  const { username, loginUrl } = params;

  const subject = `Tu cuenta fue aprobada — Tiro a Puerta Challenge`;

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
              <p style="margin:4px 0 0;font-size:9px;letter-spacing:2px;color:rgba(201,168,76,0.7);text-transform:uppercase;">CHALLENGE · MUNDIAL 2026</p>
            </td>
          </tr>

          <!-- Green approval banner -->
          <tr>
            <td style="background-color:#3CAC3B;padding:14px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#fff;letter-spacing:2px;text-transform:uppercase;">✓ CUENTA APROBADA</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">

              <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.6);">Hola,</p>
              <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#ffffff;">@${username}</p>

              <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.85);line-height:1.6;">
                Tu cuenta fue aprobada y ya puedes acceder al torneo. Elige tu primer jugador antes del deadline del día — una vez que vence el tiempo, el pick queda bloqueado.
              </p>

              <!-- Rules reminder -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.25);border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 10px;font-size:10px;letter-spacing:2px;color:#C9A84C;font-weight:700;text-transform:uppercase;">Recuerda</p>
                    <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.75);line-height:1.6;">
                      · Elige <strong style="color:#fff;">un jugador por día</strong> con partidos.
                    </p>
                    <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.75);line-height:1.6;">
                      · Si ese jugador registra al menos <strong style="color:#fff;">un tiro a puerta</strong>, sobrevives al día.
                    </p>
                    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.75);line-height:1.6;">
                      · <strong style="color:#fff;">No puedes repetir jugadores</strong> — una vez usado, quemado para siempre.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}"
                       style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#2A398D,#1B2566);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;border:1.5px solid #C9A84C;letter-spacing:1px;text-transform:uppercase;">
                      Entrar al torneo
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
                Este es un mensaje automático. No respondas a este correo.
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
