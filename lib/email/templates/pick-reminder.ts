/**
 * lib/email/templates/pick-reminder.ts
 *
 * Reminder email sent to alive users who haven't made a pick for today,
 * approximately 2 hours before the last match of the day starts.
 * Reference: game-rules.md §12.1, §13.5
 */

interface PickReminderEmailParams {
  username: string;
  matchDate: string;    // "2026-06-14"
  minutesUntilLastMatch: number; // How many minutes until the last match kicks off
  pickUrl: string;      // Full URL to the pick page
}

function formatDateSpanish(dateStr: string): string {
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} de ${months[month - 1]} de ${year}`;
}

function formatTimeRemaining(minutes: number): string {
  if (minutes >= 120) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours} horas`;
  }
  return `${minutes} minutos`;
}

export function pickReminderEmailTemplate(params: PickReminderEmailParams): {
  subject: string;
  html: string;
} {
  const { username, matchDate, minutesUntilLastMatch, pickUrl } = params;
  const formattedDate = formatDateSpanish(matchDate);
  const timeRemaining = formatTimeRemaining(minutesUntilLastMatch);

  const subject = `⏰ Aún no tienes pick — quedan ${timeRemaining}`;

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

          <!-- Urgency banner -->
          <tr>
            <td style="background-color:#C9A84C;padding:14px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#0B0D18;letter-spacing:2px;text-transform:uppercase;">⏰ RECORDATORIO DE PICK</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">

              <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.6);">Hola,</p>
              <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#ffffff;">@${username}</p>

              <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.85);line-height:1.6;">
                Todavía no tienes pick para el <strong style="color:#ffffff;">${formattedDate}</strong>.
              </p>

              <!-- Time warning box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.4);border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:#C9A84C;font-weight:700;text-transform:uppercase;">Tiempo restante</p>
                    <p style="margin:0;font-size:28px;font-weight:700;color:#C9A84C;">${timeRemaining}</p>
                    <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.5);">hasta el inicio del último partido del día</p>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(230,29,37,0.1);border:1px solid rgba(230,29,37,0.25);border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 20px;">
                    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.75);line-height:1.6;">
                      ⚠️ Si no haces tu pick antes del kickoff de tu jugador elegido, quedarás <strong style="color:#E61D25;">eliminado automáticamente</strong> del torneo.
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
                      Hacer mi pick ahora
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
