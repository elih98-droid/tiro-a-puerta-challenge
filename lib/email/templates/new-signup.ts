/**
 * lib/email/templates/new-signup.ts
 *
 * Email sent to the admin when a new user registers and needs approval.
 * Reference: ROADMAP §2.5 (optional admin notification)
 */

interface NewSignupEmailParams {
  username: string;
  email: string;
  registeredAt: string; // ISO timestamp
  approvalsUrl: string; // Full URL to /admin/approvals
}

function formatDateTimeSpanish(isoString: string): string {
  const date = new Date(isoString);
  const months = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const mins = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} · ${hours}:${mins} UTC`;
}

export function newSignupEmailTemplate(params: NewSignupEmailParams): {
  subject: string;
  html: string;
} {
  const { username, email, registeredAt, approvalsUrl } = params;
  const formattedDate = formatDateTimeSpanish(registeredAt);

  const subject = `Nuevo registro pendiente: @${username}`;

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
              <p style="margin:4px 0 0;font-size:9px;letter-spacing:2px;color:rgba(201,168,76,0.7);text-transform:uppercase;">CHALLENGE · Panel de administración</p>
            </td>
          </tr>

          <!-- Banner -->
          <tr>
            <td style="background-color:#2A398D;padding:14px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#fff;letter-spacing:2px;text-transform:uppercase;">👤 NUEVO REGISTRO PENDIENTE</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">

              <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.85);line-height:1.6;">
                Un nuevo usuario se ha registrado y espera tu aprobación para acceder al torneo.
              </p>

              <!-- User info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.04);border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:12px;">
                          <p style="margin:0 0 2px;font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Usuario</p>
                          <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">@${username}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:12px;border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;">
                          <p style="margin:0 0 2px;font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Email</p>
                          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);">${email}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;">
                          <p style="margin:0 0 2px;font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Registrado</p>
                          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);">${formattedDate}</p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${approvalsUrl}"
                       style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#2A398D,#1B2566);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;border:1.5px solid #C9A84C;letter-spacing:1px;text-transform:uppercase;">
                      Ver pendientes
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
                Este es un mensaje automático del sistema de Tiro a Puerta Challenge.
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
