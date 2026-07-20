---
name: clima
description: Consulta el clima actual y el pronostico de los proximos dias. Usar cuando el usuario pregunte por el clima, el tiempo, la temperatura, si va a llover, el pronostico, weather o forecast. Por defecto responde para Bogota, Colombia; acepta otra ciudad si el usuario la nombra.
---

# Clima

Obtiene el clima usando la API publica de [Open-Meteo](https://open-meteo.com) — sin API key, sin dependencias, sin registro.

**Ubicacion por defecto: Bogota, Colombia.** Solo consulta otra ciudad si el usuario la menciona explicitamente.

## Uso

```powershell
# Bogota, clima actual + 3 dias (caso por defecto)
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/clima/scripts/clima.ps1

# Otra ciudad
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/clima/scripts/clima.ps1 -Ciudad "Medellin"

# Mas dias de pronostico (0-7)
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/clima/scripts/clima.ps1 -Dias 7

# Solo el clima actual, sin pronostico
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/clima/scripts/clima.ps1 -Dias 0

# Detectar la ubicacion real por IP (ignora Bogota)
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/clima/scripts/clima.ps1 -Auto

# JSON crudo, para procesar el resultado
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/skills/clima/scripts/clima.ps1 -Json
```

## Parametros

| Parametro | Tipo   | Defecto | Descripcion                                          |
|-----------|--------|---------|------------------------------------------------------|
| `-Ciudad` | string | Bogota  | Nombre de la ciudad a consultar                      |
| `-Auto`   | switch | off     | Detecta la ubicacion por IP en vez de usar el defecto |
| `-Dias`   | int    | 3       | Dias de pronostico (0 = solo clima actual, max 7)    |
| `-Json`   | switch | off     | Devuelve JSON crudo en lugar del resumen legible     |

## Que devuelve

- **Actual**: estado del cielo, temperatura y sensacion termica, humedad, precipitacion, viento (velocidad + rumbo).
- **Pronostico diario**: minima/maxima, probabilidad de lluvia, estado, amanecer y atardecer.

## Como reportar al usuario

Ejecuta el script y resume el resultado en espanol, en pocas lineas. Menciona la ciudad solo si no es Bogota. Si el usuario pregunta algo puntual ("¿llueve hoy?"), responde eso primero y deja el resto como contexto breve.

## Endpoints usados

- Geocodificacion: `https://geocoding-api.open-meteo.com/v1/search`
- Pronostico: `https://api.open-meteo.com/v1/forecast`
- Geolocalizacion por IP (solo con `-Auto`): `http://ip-api.com/json/`

Requiere conexion a internet. Si la red falla, el script termina con error — no hay cache local.
