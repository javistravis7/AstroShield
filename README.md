# AstroShield // Orbital Intelligence

Aplicación educativa para optimizar una constelación de ocho satélites mediante un algoritmo evolutivo y visualizar la configuración en un globo 3D.

## Requisitos
- Python 3.10 o superior
- Navegador moderno con WebGL
- Conexión a internet para cargar Three.js y las fuentes web desde CDN

## Instalación en Windows / VS Code
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```
Si PowerShell impide activar el entorno, ejecuta `\.venv\Scripts\python.exe -m pip install -r requirements.txt` y luego `\.venv\Scripts\python.exe app.py`.

## Ejecutar la aplicación
Desde la carpeta raíz:
```powershell
python app.py
```
Abre http://127.0.0.1:5000 en el navegador. Mantén la terminal abierta mientras uses la aplicación.

## Ejecutar el algoritmo desde terminal
```powershell
python -m src.main --generations 120 --population 70 --mutation 0.22 --seed 42
```
El resultado se guarda como JSON dentro de `results/`.

## Pruebas
```powershell
python -m pytest -q
```

## Modelo y supuestos
- Cada satélite es una posición geográfica sobre una esfera, no una órbita física real.
- Cobertura: una región se cubre si la distancia de círculo máximo entre el punto del satélite y el centro regional es ≤ 300 km.
- Pesos de prioridad: Alta = 3, Media = 2, Normal = 1.
- Los radios de exclusión se interpretan como grados angulares sobre la esfera.
- Las posiciones dentro de las exclusiones se rechazan al generar/mutar. La validez se informa por separado de la aptitud.
- Algoritmo: selección por torneo, cruce de un punto, mutación, elitismo de dos individuos y población configurable.

## Pruebas y análisis
Consulta `docs/definicion_problema.md`, `docs/pruebas.md` y `docs/analisis_resultados.md`. Usa resultados reales del sistema; no declares pruebas ejecutadas que no hayas realizado.

## Uso de IA
Documenta de forma honesta qué tareas se apoyaron con IA y qué verificaciones hizo el equipo.
