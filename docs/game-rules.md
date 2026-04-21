# Reglas del Juego — Quiniela Mundial FIFA 2026

**Versión:** 1.0 (borrador inicial)
**Última actualización:** Abril 2026
**Estado:** Documento maestro — fuente de verdad del juego

> Este documento es la referencia oficial de las reglas del juego. Cualquier discrepancia entre este documento y otros materiales (sitio web, términos y condiciones, FAQ) se resuelve a favor de lo aquí establecido, hasta que se publique una versión actualizada.

---

## 1. Propósito y resumen ejecutivo

Quiniela tipo "survivor pool" ambientada en la Copa Mundial de la FIFA 2026. Cada usuario debe elegir, cada día que haya partidos, a **un solo jugador** de cualquier partido de ese día. Si el jugador elegido registra al menos un tiro a puerta durante ese partido, el usuario sobrevive y avanza al siguiente día. Si no, queda eliminado.

Los usuarios no pueden repetir jugadores a lo largo del torneo. Una vez elegido un jugador, queda "quemado" para los días posteriores.

Ganan los usuarios que sobrevivan hasta el final del torneo. El desempate entre sobrevivientes se resuelve por el total de goles anotados por los jugadores elegidos a lo largo del torneo.

---

## 2. Definiciones

**Torneo**: la Copa Mundial de la FIFA 2026, con sede en Estados Unidos, Canadá y México, del 11 de junio al 19 de julio de 2026.

**Día de pick**: día calendario (en hora de Ciudad de México) en el que se disputa al menos un partido del torneo.

**Pick**: la elección de un jugador por parte de un usuario para un día de pick específico.

**Tiro a puerta (shot on target)**: se utiliza la definición oficial de FIFA/Opta. Un tiro a puerta es cualquier tiro dirigido al marco que resultaría en gol si el portero no interviene. Esto incluye:
- Goles anotados (toda anotación válida es por definición tiro a puerta).
- Tiros atajados por el portero.
- Tiros que pegan en el poste o travesaño **y entran** como gol.

**NO** se consideran tiros a puerta:
- Tiros bloqueados por un defensa antes de llegar al portero.
- Tiros que pegan en el poste/travesaño y **no** entran.
- Tiros desviados fuera del marco.
- Autogoles (ver sección 7).

**Sobrevivir**: el usuario avanza al siguiente día de pick porque su jugador elegido registró al menos un tiro a puerta en el partido correspondiente.

**Eliminación**: el usuario queda fuera del torneo de forma definitiva y no puede volver a participar.

**Deadline**: el momento límite para hacer o cambiar un pick para un partido específico. Está fijado en **5 minutos antes del kickoff oficial** del partido del jugador elegido.

**Pool de jugadores elegibles**: conjunto de jugadores disponibles para ser elegidos en un momento determinado. Cambia dinámicamente conforme avanzan los partidos del día y según los jugadores que el usuario ya haya "quemado" en días anteriores.

**Fuente oficial de datos**: el proveedor de datos deportivos que utilice la plataforma (por ejemplo, Sportradar, Opta, API-Football). Su definición está pendiente pero la regla operacional no cambia.

---

## 3. Mecánica del juego

### 3.1 El pick diario

Cada día que haya partidos, el usuario debe elegir **un solo jugador** de cualquier partido de ese día. El jugador puede pertenecer a cualquiera de los equipos en juego.

### 3.2 Ventana de selección

El usuario puede hacer su pick desde el momento en que abre el "día de pick" (típicamente al finalizar el último partido del día anterior, o al inicio oficial del torneo) hasta **5 minutos antes del kickoff del partido del jugador elegido**.

Si el usuario aún no ha elegido a nadie cuando arranca el primer partido del día, todavía puede elegir a jugadores de los partidos posteriores del mismo día, siempre que el pick se haga antes del deadline del partido correspondiente.

### 3.3 Cambio de pick

El usuario puede modificar su pick cuantas veces quiera antes del deadline. El nuevo pick puede ser cualquier jugador de cualquier partido del día que aún no haya iniciado (menos el buffer de 5 minutos).

El deadline efectivo se recalcula cada vez que el usuario cambia el pick, basado en el partido del nuevo jugador elegido.

**Ejemplo**: un usuario elige a Messi para el partido de la 1:00 pm. Su deadline es 12:55 pm. A las 11:30 am cambia a Mbappé (partido de 4:00 pm). Su nuevo deadline es 3:55 pm. A las 3:00 pm puede cambiar otra vez, siempre que el partido del nuevo jugador no haya arrancado.

### 3.4 Jugadores "quemados"

Una vez que un usuario elige a un jugador en un día cualquiera, ese jugador queda **permanentemente excluido** de sus opciones para el resto del torneo, sin importar el resultado del pick. Esto aplica incluso si el partido fue cancelado, si el jugador no jugó, o si el pick resultó en sobrevivir o ser eliminado.

### 3.5 Pool de jugadores elegibles

El pool de jugadores elegibles para un usuario en un momento dado está compuesto por:
- Todos los jugadores registrados en las plantillas oficiales de los equipos que disputarán partidos ese día.
- Menos los jugadores de partidos que ya iniciaron (ya no se pueden elegir).
- Menos los jugadores que ese usuario específico ya "quemó" en días anteriores.

Los **porteros** son elegibles. El usuario asume el riesgo de que los porteros rara vez registran tiros a puerta.

---

## 4. Reglas de supervivencia y eliminación

### 4.1 Condición de supervivencia

El usuario sobrevive al día si:
1. Hizo un pick válido antes del deadline correspondiente, Y
2. El jugador elegido jugó al menos un minuto oficial en el partido, Y
3. El jugador elegido registró al menos un tiro a puerta (según la definición en sección 2) durante el tiempo que estuvo en cancha.

### 4.2 Condiciones de eliminación

El usuario queda eliminado si se cumple cualquiera de las siguientes:

**E1. No hizo pick:** el usuario no seleccionó a ningún jugador antes del deadline del último partido del día.

**E2. Pick sin tiro a puerta:** el jugador elegido jugó pero no registró ningún tiro a puerta durante el partido.

**E3. Jugador no disputó:** el jugador elegido no jugó ni un solo minuto oficial (no fue convocado, no fue alineado, quedó en banca sin entrar, o fue sustituido por lesión durante el calentamiento). Se considera "no haber jugado" cuando la fuente oficial de datos reporta **cero minutos jugados**.

### 4.3 Tiros contabilizados

Para determinar si el jugador registró un tiro a puerta, se contabilizan los tiros en:
- Tiempo regular (90 minutos + descuento).
- Tiempo extra (prórrogas en fase eliminatoria).

**NO** se contabilizan los tiros en tanda de penales.

### 4.4 Irreversibilidad

Una vez que un usuario es eliminado, no puede volver a participar en el torneo. No hay "vidas extra", "rescates" ni "repechaje".

---

## 5. Criterios de desempate

### 5.1 Criterio principal: goles acumulados

Si al final del torneo hay más de un usuario sobreviviente, el ganador se define por el **total de goles anotados** por todos los jugadores que cada usuario eligió a lo largo del torneo.

Se contabilizan los goles en:
- Tiempo regular (90 minutos + descuento).
- Tiempo extra.

**NO** se contabilizan los goles en tanda de penales.

### 5.2 Autogoles

Los autogoles **no cuentan** para el usuario que tenía a ese jugador como pick ese día (ver sección 7.2 para detalle).

### 5.3 Empate en goles

Si después del primer desempate persiste el empate entre dos o más sobrevivientes, se aplican los siguientes criterios en orden:

1. **Mayor número de días sobrevividos sin "repetir categoría":** usuarios que variaron más entre delanteros, mediocampistas y defensores ganan sobre los que se concentraron en un solo perfil.
2. **Orden cronológico de registro:** usuario con fecha/hora de registro más temprana gana.
3. **Sorteo:** si nada de lo anterior desempata, se realiza un sorteo transparente en vivo (con streaming público).

> **Nota:** los criterios 1 y 2 pueden revisarse antes del lanzamiento. El criterio 3 (sorteo) se mantiene como último recurso.

---

## 6. Ventanas de tiempo y deadlines

### 6.1 Zona horaria oficial

El juego opera internamente en **hora de Ciudad de México (America/Mexico_City)**. Todos los deadlines, definiciones de "día de pick" y cierres se calculan en esta zona horaria.

### 6.2 Visualización para el usuario

La interfaz muestra todos los horarios (partidos, deadlines, recordatorios) en la **zona horaria local del usuario**, detectada automáticamente por el navegador. La conversión es puramente cosmética; la regla oficial siempre es CDMX.

### 6.3 Deadline por pick

El deadline para un pick es **5 minutos antes del kickoff oficial** del partido del jugador elegido (hora CDMX).

### 6.4 Cierre de registros de usuarios

Los registros de nuevos usuarios cierran **5 minutos antes del kickoff del partido inaugural** (México vs. Sudáfrica, 11 de junio de 2026, 1:00 pm CDMX). Después de ese momento no se aceptan nuevas cuentas para el torneo.

### 6.5 Resultados finales

Los resultados de cada partido se consideran **definitivos 24 horas después del silbatazo final**. Durante esas 24 horas, correcciones de la fuente oficial de datos se reflejan automáticamente en el estado de los picks. Pasado ese periodo, los resultados son inapelables (salvo los casos de apelación humana descritos en sección 11.3).

---

## 7. Casos borde

Esta sección documenta el manejo de situaciones no cubiertas por las reglas generales.

### 7.1 Partido suspendido y reanudado

Si un partido se **suspende** (por clima, apagón, incidente de seguridad, etc.) y posteriormente **se reanuda** —aunque sea en otro día— el pick del usuario se mantiene y se contabilizan los tiros del **partido completo**, tanto los del segmento original como los de la reanudación.

El jugador sigue "quemado" para el usuario durante todo este proceso.

### 7.2 Partido cancelado definitivamente

Si un partido se **cancela de forma definitiva** y no se reanuda ni reprograma, todos los picks de ese partido **se anulan**. Los usuarios afectados:
- **Sobreviven automáticamente al día** (el pick cancelado no causa eliminación).
- **NO acumulan goles** por ese pick (para efectos del desempate).
- **El jugador elegido queda igualmente "quemado"** (no se libera para picks futuros).

### 7.3 Jugador expulsado o lesionado durante el partido

Si el jugador elegido es expulsado (tarjeta roja, directa o por doble amarilla) o sale por lesión/sustitución durante el partido:
- **Si registró al menos un tiro a puerta antes de salir**, el usuario sobrevive normalmente.
- **Si no registró tiros a puerta antes de salir**, el usuario queda eliminado (regla general E2).

No hay tratamiento especial por expulsiones o lesiones: se aplica la regla general de supervivencia.

### 7.4 Autogol del jugador elegido

Si el jugador elegido anota un **autogol** (en su propia portería):
- El autogol **NO cuenta como tiro a puerta** para efectos de supervivencia.
- El autogol **NO cuenta como gol** para efectos del desempate.
- Si el autogol fue la única acción ofensiva del jugador, el usuario queda eliminado (salvo que haya otros tiros a puerta reales del mismo jugador en el partido).

### 7.5 Jugador no convocado o no utilizado

Se considera que un jugador "no jugó" cuando la fuente oficial de datos reporta **cero minutos jugados**. Esto incluye:
- No convocado al partido.
- Convocado pero no incluido en alineación titular ni sustituciones.
- Se lesionó en calentamiento o antes del kickoff y fue reemplazado.

En todos estos casos aplica la regla E3 (sección 4.2): eliminación del usuario.

### 7.6 Discrepancias o correcciones en los datos oficiales

La fuente oficial de datos es la única referencia para determinar tiros a puerta, goles y minutos jugados. Si la fuente corrige un dato posteriormente (dentro del periodo de 24 horas después del partido), el estado del pick se actualiza automáticamente según los datos corregidos.

Después de las 24 horas, los resultados son inapelables, salvo los casos de apelación humana (sección 11.3).

---

## 8. Fuente de verdad y resolución de disputas

### 8.1 Fuente oficial

La plataforma designa una fuente oficial de datos deportivos (proveedor específico por definir, por ejemplo Sportradar u Opta). Los datos de esta fuente son la única base para determinar:
- Alineaciones y minutos jugados.
- Tiros a puerta (cantidad y atribución).
- Goles (cantidad, tipo, y atribución).
- Tiempo de juego (inicio, fin, suspensiones).

### 8.2 Inapelabilidad general

Los usuarios no pueden apelar decisiones basadas en los datos de la fuente oficial. Esto incluye:
- "Yo vi que sí tiró a puerta y la API dice que no."
- "Ese gol fue suyo, no del rebote del portero."
- "El VAR lo anuló pero debería contar."

La plataforma siempre se alinea con la fuente oficial, sin excepciones basadas en interpretación de jugadas.

### 8.3 Excepciones: apelaciones humanas

Ver sección 11.3 para los casos excepcionales en los que sí procede revisión humana (hackeo de cuenta, fraude demostrable, errores técnicos de la plataforma).

---

## 9. Registro y cuentas de usuarios

### 9.1 Métodos de registro

Los usuarios pueden crearse una cuenta mediante:
- **Email + contraseña** (con verificación obligatoria de email).
- **Google Sign-In** (OAuth).
- **Apple Sign-In** (OAuth).

### 9.2 Verificación de email

Los usuarios registrados vía email+contraseña deben verificar su dirección de email antes de poder hacer su primer pick. El enlace de verificación tiene validez de 24 horas; después de ese plazo debe solicitarse uno nuevo.

Los usuarios registrados vía OAuth se consideran verificados automáticamente (Google/Apple ya verificó su email).

### 9.3 Edad mínima

Al registrarse, el usuario debe confirmar mediante checkbox que es **mayor de 18 años**. No se verifica esta declaración automáticamente, pero aceptarla falsamente puede ser causa de descalificación.

### 9.4 Cuentas por persona

Solo se permite **una cuenta por persona**. Se implementan las siguientes medidas de control:
- Unicidad de email (no se permiten emails duplicados).
- Monitoreo pasivo de patrones sospechosos (múltiples cuentas desde un mismo device fingerprint, mismo IP en ventana corta, etc.).

La detección de múltiples cuentas del mismo usuario puede resultar en descalificación (sección 11).

### 9.5 Cierre de registros

Los registros cierran **5 minutos antes del kickoff del partido inaugural** (11 de junio de 2026, 12:55 pm CDMX). Después no se aceptan nuevas cuentas.

---

## 10. Privacidad de picks y leaderboard

### 10.1 Visibilidad de picks

Los picks individuales son **privados hasta el deadline** del pick correspondiente. Nadie (ni siquiera otros usuarios) puede ver qué jugador eligió alguien más antes de que cierre su deadline.

Después del deadline, los picks se vuelven **públicos** y son visibles para todos los usuarios del torneo.

### 10.2 Leaderboard

La plataforma mantiene un **leaderboard público** visible para todos los usuarios (registrados o no). El leaderboard muestra:
- Usuarios que siguen vivos en el torneo.
- Total de goles acumulados por cada sobreviviente (para transparencia del desempate).
- Historial de picks pasados de cada usuario.

### 10.3 Identificación pública

Cada usuario elige un **username público** al registrarse. Este username es el que aparece en el leaderboard y en la visualización de picks post-deadline.

El username puede ser distinto al nombre real del usuario. Se prohíben usernames ofensivos, suplantación de identidad (usernames tipo "FIFA_Official"), o que violen derechos de terceros.

### 10.4 Estructura del torneo

Para la versión inicial del proyecto (MVP), existe **un solo torneo global** en el que todos los usuarios compiten entre sí. No hay ligas privadas, salas o grupos.

*Nota técnica: el schema de base de datos se diseñará de forma que permita añadir ligas privadas en el futuro sin migración compleja.*

---

## 11. Anti-trampa y sanciones

### 11.1 Medidas preventivas

La plataforma implementa las siguientes protecciones:

- **CAPTCHA** en registro de cuenta, login después de 3 intentos fallidos, y recuperación de contraseña.
- **Rate limiting** por usuario autenticado: máximo ~30 requests/minuto para endpoints normales, ~5/minuto para endpoints sensibles (crear cuenta, cambiar email).
- **Verificación de email obligatoria** para poder hacer el primer pick.
- **Device fingerprinting** pasivo (hash de user-agent + IP) para detección de patrones sospechosos.
- **Alertas automáticas** ante patrones anómalos (muchas cuentas desde misma IP, picks idénticos desde mismo device, etc.).

### 11.2 Conductas prohibidas

Se consideran violaciones a las reglas:

- Crear más de una cuenta por persona.
- Usar bots o scripts automatizados para hacer picks.
- Explotar bugs o vulnerabilidades de la plataforma.
- Suplantar identidad de otros usuarios o de personalidades reales.
- Manipular datos, hackear cuentas ajenas o intentar acceder a información privilegiada (picks ajenos antes del deadline).

La compartición de picks entre usuarios por canales externos (WhatsApp, grupos, etc.) **no** está prohibida. Lo que cada usuario haga por fuera de la plataforma es su responsabilidad.

### 11.3 Sanciones y apelaciones humanas

Las sanciones se aplican **caso por caso según gravedad**, desde warning hasta descalificación permanente.

Se admite revisión humana (apelación) únicamente en casos excepcionales documentados, tales como:

- **Hackeo demostrable de cuenta** (el usuario prueba que su cuenta fue comprometida por un tercero).
- **Error técnico atribuible a la plataforma** (el pick no se guardó por un bug del servidor, no por responsabilidad del usuario).
- **Falla masiva de la fuente oficial de datos** (evento excepcional donde la fuente reporta datos claramente erróneos).

Las apelaciones deben presentarse por email dentro de las **48 horas** siguientes al evento. La decisión del equipo de operaciones es final.

---

## 12. Comunicaciones con usuarios

### 12.1 Emails transaccionales (obligatorios)

Todos los usuarios reciben los siguientes emails, sin opción de opt-out:

- **Verificación de email**: al momento del registro.
- **Recuperación de contraseña**: cuando el usuario la solicita.
- **Notificación de eliminación**: cuando el usuario queda eliminado del torneo, con explicación de por qué (ej: "tu jugador Mbappé no registró tiro a puerta el 14 de junio").
- **Recordatorio de pick pendiente**: enviado solo si el usuario **no ha hecho pick** y falta poco tiempo para el deadline (ventana exacta por definir, por ejemplo 2 horas antes del último partido del día).
- **Notificaciones de cambios críticos** (cambios en reglas, información legal, suspensión del torneo, etc.).

### 12.2 Emails de marketing (opt-out disponible)

Los usuarios pueden desactivar, desde su configuración de cuenta:

- Resúmenes diarios/semanales del torneo.
- Anuncios de nuevas features.
- Comunicaciones promocionales.

Esta separación entre transaccional y marketing es consistente con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) de México.

### 12.3 Canales de notificación

Para esta versión del producto (MVP), se utiliza **solo email**. No se implementan notificaciones push, WhatsApp o SMS en la primera iteración.

---

## 13. Decisiones pendientes

Las siguientes decisiones están explícitamente **pendientes** y deben resolverse antes del lanzamiento oficial. Se documentan aquí para tenerlas visibles:

### 13.1 Estructura económica y premios
- ¿Habrá costo de entrada? ¿Cuánto?
- ¿Qué tipo de premio (efectivo, en especie, patrocinado, simbólico)?
- ¿Cómo se reparten los premios en caso de empate?
- Esta decisión determina si aplica regulación de SEGOB y si se requiere estructura legal de sorteo.

### 13.2 Estructura legal
- ¿Operará como persona física con actividad empresarial, o como persona moral?
- RFC y estructura fiscal.
- Términos y condiciones formales.
- Aviso de privacidad conforme a LFPDPPP.

### 13.3 Proveedor de datos deportivos
- Elección definitiva del proveedor (Sportradar, Opta, API-Football, StatsPerform, etc.).
- Plan y costo del contrato.
- SLA y protocolos de respaldo.

### 13.4 Criterios de desempate secundarios (sección 5.3)
- Revisar si los criterios 1 y 2 propuestos son los más justos.
- Definir los detalles operacionales del sorteo si se llega a él.

### 13.5 Detalles de la ventana de recordatorio
- Definir exactamente cuántas horas antes del deadline se envía el recordatorio de pick pendiente.

### 13.6 Servicio al cliente
- Canal de contacto para apelaciones (email específico).
- Tiempos de respuesta comprometidos.
- Política de privacidad del manejo de tickets.

---

## 14. Anexo: Calendario tentativo del Mundial 2026

- **Fecha de inicio**: 11 de junio de 2026 (partido inaugural: México vs. Sudáfrica en el Estadio Azteca, 1:00 pm CDMX aprox.).
- **Fecha final**: 19 de julio de 2026 (final en MetLife Stadium, New York/New Jersey).
- **Duración**: 39 días.
- **Total de partidos**: 104.
- **Formato**: 48 equipos en 12 grupos de 4. Avanzan los 2 primeros de cada grupo más los 8 mejores terceros, a una ronda de 32 (nueva). Luego octavos, cuartos, semifinales y final.
- **Días con partidos**: a confirmar según calendario oficial (aprox. 30-33 días de los 39 totales tienen partidos).
- **Sedes**: 16 estadios en Canadá, México y Estados Unidos.

> El calendario exacto día por día debe consumirse de la fuente oficial (FIFA) y sincronizarse en la base de datos antes del inicio del torneo. El número final de "días de pick" y, por tanto, el número total de picks por usuario, se confirma una vez cargado el calendario.

---

## Historial de versiones

- **v1.0 (abril 2026)**: versión inicial del documento, elaborada antes del inicio del torneo. Decisiones principales tomadas; decisiones económicas y legales pendientes (sección 13).

---

*Fin del documento.*
