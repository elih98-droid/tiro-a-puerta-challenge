/**
 * lib/email/templates/elimination.ts
 *
 * Email sent when a user is eliminated from the tournament.
 * Reference: game-rules.md §12.1
 *
 * Why inline styles?
 *   Email clients (Gmail, Outlook, Apple Mail) strip <style> blocks and CSS
 *   variables. Everything must be written with style="" attributes using
 *   hard-coded hex values.
 */

export type EliminationReason =
  | "no_shot_on_target"
  | "player_did_not_play"
  | "no_pick";

interface EliminationEmailParams {
  username: string;
  playerName?: string; // undefined when reason is 'no_pick'
  matchDate: string;   // "2026-06-14"
  reason: EliminationReason;
  daysSurvived: number;
  goalsAccumulated: number;
}

// Converts a YYYY-MM-DD string to a readable Spanish date: "14 de junio de 2026"
function formatDateSpanish(dateStr: string): string {
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} de ${months[month - 1]} de ${year}`;
}

function reasonMessage(reason: EliminationReason, playerName?: string): string {
  switch (reason) {
    case "no_shot_on_target":
      return `Tu jugador <strong>${playerName}</strong> no registró ningún tiro a puerta en el partido.`;
    case "player_did_not_play":
      return `Tu jugador <strong>${playerName}</strong> no jugó en el partido (no convocado, lesionado o sin minutos).`;
    case "no_pick":
      return "No registraste un pick para este día. Según las reglas del juego (§4.2), la ausencia de pick resulta en eliminación automática.";
  }
}

export function eliminationEmailTemplate(params: EliminationEmailParams): {
  subject: string;
  html: string;
} {
  const { username, playerName, matchDate, reason, daysSurvived, goalsAccumulated } = params;
  const formattedDate = formatDateSpanish(matchDate);
  const message = reasonMessage(reason, playerName);

  const subject = `Quedaste eliminado — Tiro a Puerta Challenge`;

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

          <!-- Red elimination banner -->
          <tr>
            <td style="background-color:#E61D25;padding:14px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#fff;letter-spacing:2px;text-transform:uppercase;">✕ ELIMINADO</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">

              <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.6);">Hola,</p>
              <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#ffffff;">@${username}</p>

              <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.85);line-height:1.6;">
                Quedaste eliminado del torneo el <strong style="color:#ffffff;">${formattedDate}</strong>.
              </p>

              <!-- Reason box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(230,29,37,0.12);border:1px solid rgba(230,29,37,0.3);border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:#E61D25;font-weight:700;text-transform:uppercase;">Razón</p>
                    <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);line-height:1.6;">${message}</p>
                  </td>
                </tr>
              </table>

              <!-- Stats -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td width="50%" style="padding:16px;background-color:rgba(255,255,255,0.04);border-radius:8px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.45);text-transform:uppercase;">Días sobrevividos</p>
                    <p style="margin:0;font-size:32px;font-weight:700;color:#3CAC3B;">${daysSurvived}</p>
                  </td>
                  <td width="8px"></td>
                  <td width="50%" style="padding:16px;background-color:rgba(255,255,255,0.04);border-radius:8px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.45);text-transform:uppercase;">Goles acumulados</p>
                    <p style="margin:0;font-size:32px;font-weight:700;color:#C9A84C;">${goalsAccumulated}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;text-align:center;">
                Gracias por participar en el Tiro a Puerta Challenge.<br>¡Hasta el próximo torneo!
              </p>

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
