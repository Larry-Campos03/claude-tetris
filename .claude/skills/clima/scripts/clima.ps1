<#
.SYNOPSIS
  Consulta el clima actual y el pronostico usando Open-Meteo (sin API key).

.PARAMETER Ciudad
  Nombre de la ciudad. Por defecto: Bogota, Colombia.

.PARAMETER Auto
  Ignora el valor por defecto y detecta la ubicacion por IP.

.PARAMETER Dias
  Dias de pronostico (0-7). Por defecto 3.

.PARAMETER Json
  Devuelve el resultado crudo en JSON en vez del resumen legible.

.EXAMPLE
  powershell -File clima.ps1                          # Bogota (por defecto)
  powershell -File clima.ps1 -Ciudad "Medellin" -Dias 5
  powershell -File clima.ps1 -Auto                    # ubicacion por IP
  powershell -File clima.ps1 -Json
#>
[CmdletBinding()]
param(
    [string]$Ciudad,
    [switch]$Auto,
    [ValidateRange(0, 7)][int]$Dias = 3,
    [switch]$Json
)

# Ubicacion por defecto del usuario
$CIUDAD_DEFECTO = 'Bogota'
$PAIS_DEFECTO = 'Colombia'

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# WMO weather codes -> descripcion en espanol
$WMO = @{
    0 = 'Despejado'; 1 = 'Mayormente despejado'; 2 = 'Parcialmente nublado'; 3 = 'Nublado'
    45 = 'Niebla'; 48 = 'Niebla con escarcha'
    51 = 'Llovizna ligera'; 53 = 'Llovizna moderada'; 55 = 'Llovizna intensa'
    56 = 'Llovizna helada ligera'; 57 = 'Llovizna helada intensa'
    61 = 'Lluvia ligera'; 63 = 'Lluvia moderada'; 65 = 'Lluvia fuerte'
    66 = 'Lluvia helada ligera'; 67 = 'Lluvia helada fuerte'
    71 = 'Nieve ligera'; 73 = 'Nieve moderada'; 75 = 'Nieve fuerte'; 77 = 'Granos de nieve'
    80 = 'Chubascos ligeros'; 81 = 'Chubascos moderados'; 82 = 'Chubascos violentos'
    85 = 'Chubascos de nieve ligeros'; 86 = 'Chubascos de nieve fuertes'
    95 = 'Tormenta electrica'; 96 = 'Tormenta con granizo ligero'; 99 = 'Tormenta con granizo fuerte'
}

function Get-Desc([int]$code) {
    if ($WMO.ContainsKey($code)) { return $WMO[$code] }
    return "Codigo $code"
}

function Get-Rumbo([double]$deg) {
    $puntos = @('N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO')
    return $puntos[[int](([math]::Round($deg / 22.5)) % 16)]
}

# --- 1. Resolver ubicacion ---------------------------------------------------
if ($Auto -and -not $Ciudad) {
    $ip = Invoke-RestMethod -Uri 'http://ip-api.com/json/?fields=status,message,city,regionName,country,lat,lon,timezone' -TimeoutSec 20
    if ($ip.status -ne 'success') {
        Write-Error "No se pudo detectar la ubicacion por IP: $($ip.message)"
        exit 1
    }
    $lat = $ip.lat
    $lon = $ip.lon
    $nombre = @($ip.city, $ip.regionName, $ip.country | Where-Object { $_ }) -join ', '
    $tz = $ip.timezone
}
else {
    $busqueda = if ($Ciudad) { $Ciudad } else { $CIUDAD_DEFECTO }
    $geoUrl = "https://geocoding-api.open-meteo.com/v1/search?name=$([uri]::EscapeDataString($busqueda))&count=10&language=es&format=json"
    $geo = Invoke-RestMethod -Uri $geoUrl -TimeoutSec 20
    if (-not $geo.results -or $geo.results.Count -eq 0) {
        Write-Error "No se encontro la ciudad '$busqueda'."
        exit 1
    }
    # Sin ciudad explicita, forzar el pais por defecto para evitar homonimos
    $candidatos = @($geo.results)
    if (-not $Ciudad) {
        $filtrados = @($candidatos | Where-Object { $_.country -eq $PAIS_DEFECTO })
        if ($filtrados.Count -gt 0) { $candidatos = $filtrados }
    }
    $lugar = $candidatos[0]
    $lat = $lugar.latitude
    $lon = $lugar.longitude
    $nombre = @($lugar.name, $lugar.admin1, $lugar.country | Where-Object { $_ }) -join ', '
    $tz = $lugar.timezone
}

# --- 2. Consultar Open-Meteo -------------------------------------------------
$li = [Globalization.CultureInfo]::InvariantCulture
$q = @(
    "latitude=$($lat.ToString($li))"
    "longitude=$($lon.ToString($li))"
    'current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day'
    'daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset'
    'timezone=auto'
    "forecast_days=$([math]::Max(1, $Dias))"
) -join '&'

$w = Invoke-RestMethod -Uri "https://api.open-meteo.com/v1/forecast?$q" -TimeoutSec 20

if ($Json) {
    [pscustomobject]@{
        lugar    = $nombre
        lat      = $lat
        lon      = $lon
        timezone = $tz
        clima    = $w
    } | ConvertTo-Json -Depth 10
    exit 0
}

# --- 3. Salida legible -------------------------------------------------------
$c = $w.current
$u = $w.current_units

Write-Output "Clima en $nombre  ($($lat.ToString($li)), $($lon.ToString($li)))"
Write-Output "Actualizado: $($c.time)  [$($w.timezone)]"
Write-Output ''
Write-Output "  Estado......: $(Get-Desc $c.weather_code)$(if ($c.is_day -eq 0) { ' (noche)' })"
Write-Output "  Temperatura.: $($c.temperature_2m)$($u.temperature_2m) (sensacion $($c.apparent_temperature)$($u.apparent_temperature))"
Write-Output "  Humedad.....: $($c.relative_humidity_2m)$($u.relative_humidity_2m)"
Write-Output "  Precipitac..: $($c.precipitation)$($u.precipitation)"
Write-Output "  Viento......: $($c.wind_speed_10m)$($u.wind_speed_10m) del $(Get-Rumbo $c.wind_direction_10m)"

if ($Dias -gt 0) {
    Write-Output ''
    Write-Output "Pronostico ($Dias dia(s)):"
    for ($i = 0; $i -lt [math]::Min($Dias, $w.daily.time.Count); $i++) {
        $fecha = $w.daily.time[$i]
        $min = $w.daily.temperature_2m_min[$i]
        $max = $w.daily.temperature_2m_max[$i]
        $prob = $w.daily.precipitation_probability_max[$i]
        $desc = Get-Desc $w.daily.weather_code[$i]
        $amanece = ($w.daily.sunrise[$i] -split 'T')[1]
        $atardece = ($w.daily.sunset[$i] -split 'T')[1]
        Write-Output ("  {0}  {1,5}/{2,-5}{3}  lluvia {4,3}%  {5}  (sol {6}-{7})" -f `
                $fecha, $min, $max, $u.temperature_2m, $prob, $desc, $amanece, $atardece)
    }
}
