/**
 * lib/email/templates/substitute-warning.ts
 *
 * Warning email sent when a user's picked player is NOT in the Starting XI.
 * Triggered by the check-lineups cron ~30-40 minutes before kickoff, giving
 * the user time to change their pick before the deadline (kickoff time).
 */

interface SubstituteWarningEmailParams {
  username: string;
  playerName: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;      // "2026-06-14"
  kickoffTime: string;    // "14:00" in CDMX timezone
  pickUrl: string;        // Full URL to the pick page with ?date= param
}

function formatDateSpanish(dateStr: string): string {
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} de ${months[month - 1]} de ${year}`;
}

export function substituteWarningEmailTemplate(params: SubstituteWarningEmailParams): {
  subject: string;
  html: string;
} {
  const { username, playerName, homeTeam, awayTeam, matchDate, kickoffTime, pickUrl } = params;
  const formattedDate = formatDateSpanish(matchDate);

  const subject = `⚠️ ${playerName} no es titular — cambia tu pick`;

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
              <p style="margin:4px 0 0;font-size:9px;letter-spacing:2px;color:rgba(201,168,76,0.7);text-transform:uppercase;">CHALLENGE &middot; MEX &middot; USA &middot; CAN 2026</p>
            </td>
          </tr>

          <!-- Warning banner -->
          <tr>
            <td style="background-color:#C9A84C;padding:14px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#0B0D18;letter-spacing:2px;text-transform:uppercase;">&#9888;&#65039; TU JUGADOR NO ES TITULAR</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">

              <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.6);">Hola,</p>
              <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#ffffff;">@${username}</p>

              <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.85);line-height:1.6;">
                Las alineaciones de <strong style="color:#ffffff;">${homeTeam} vs ${awayTeam}</strong> fueron publicadas y tu pick
                <strong style="color:#C9A84C;">${playerName}</strong> est&aacute; en la banca.
              </p>

              <!-- Player info box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.4);border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:#C9A84C;font-weight:700;text-transform:uppercase;">Jugador en banca</p>
                    <p style="margin:0;font-size:24px;font-weight:700;color:#C9A84C;">${playerName}</p>
                    <p style="margin:8px 0 0;font-size:12px;color:rgba(255,255,255,0.5);">${homeTeam} vs ${awayTeam} &middot; ${formattedDate}</p>
                  </td>
                </tr>
              </table>

              <!-- Deadline reminder -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(230,29,37,0.1);border:1px solid rgba(230,29,37,0.25);border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 20px;">
                    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.75);line-height:1.6;">
                      &#9200; Tienes hasta el kickoff (<strong style="color:#ffffff;">${kickoffTime} CDMX</strong>) para cambiar tu pick.
                      Si tu jugador no juega, quedar&aacute;s <strong style="color:#E61D25;">eliminado</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${pickUrl}"
                       style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#2A398D,#1B2566);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;border:1.5px solid #C9A84C;letter-spacing:1px;text-transform:uppercase;">
                      Cambiar mi pick
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
                Este es un mensaje autom&aacute;tico. No respondas a este correo.
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
