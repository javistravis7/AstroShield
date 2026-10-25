# AstroShield // Orbital Intelligence

Simulación educativa que evoluciona ocho posiciones de satélites y muestra sus resultados en un globo 3D interactivo. Conserva el diseño original de la aplicación.

## Requisitos

- Python 3.10 o superior; verificado en Python 3.14.0.
- Flask >=3,<4 y pytest >=8,<9 (`requirements.txt`).
- Navegador con WebGL y conexión para Three.js 0.164.1 y fuentes desde CDN.
- Node.js solo para las pruebas de comportamiento de la interfaz; no requiere npm ni paquetes adicionales. Verificado con Node 24.11.0.

## Windows / PowerShell

Abre una terminal en la raíz `AstroShield`:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

No es necesario activar el entorno. Opcionalmente usa `.\.venv\Scripts\Activate.ps1` y luego `python app.py`. La ruta correcta comienza con `.\`, no con `\`.

## Windows / Git Bash

```bash
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt
./.venv/Scripts/python.exe app.py
```

También puedes activar con `source .venv/Scripts/activate`. En Linux/macOS los ejecutables del entorno están en `.venv/bin/`.

Abre http://127.0.0.1:5000 y conserva la terminal abierta. `Ctrl+C` detiene el servidor. No abras `web/index.html` directamente: necesita la API de Flask. No se requiere npm; el `package-lock.json` local previo no forma parte de las dependencias Python ni fue modificado por esta corrección.

## Demostración

1. Deja 120 generaciones, población 70 y mutación 0.22; escribe semilla 42 y ejecuta.
2. Alterna INICIAL y FINAL: se actualizan posiciones, métricas, cobertura, tabla, leyenda y validaciones. La curva sigue mostrando la ejecución completa.
3. Arrastra el globo, usa la rueda y CENTRAR. No se añadieron continentes ni efectos al diseño existente.
4. Activa ESPACIO REDUCIDO: se añade una exclusión de 6° sobre Yucatán. El resultado esperado del experimento registrado es válido y parcial, 5/6 regiones; no equivale a objetivo cumplido.
5. Activa CAMBIAR PRIORIDADES: Yucatán pasa de peso 3 a 1 y Australia de 1 a 3. Mira tanto el número de regiones como la cobertura ponderada. Un cambio de puntuación no demuestra un cambio de posiciones.
6. RESTAURAR ESCENARIO recupera los valores originales. COMPARAR 5 SEMILLAS bloquea los controles durante toda la comparación y descarga los cinco resultados completos. Usa una semilla inicial ≤4294967291 para que sus cuatro sucesoras estén dentro del dominio.
7. EXPORTAR JSON descarga la ejecución que se muestra, con ambas configuraciones y su escenario. Cada optimización exitosa también guarda un JSON único en `results/`.

## Terminal, pruebas y nuevas evidencias

En PowerShell, desde la raíz:

```powershell
.\.venv\Scripts\python.exe -m src.main --generations 120 --population 70 --mutation 0.22 --seed 42
.\.venv\Scripts\python.exe -B -m pytest -q -p no:cacheprovider
node --test tests/ui.test.cjs
.\.venv\Scripts\python.exe -B -m src.experiments
```

En Git Bash usa `./.venv/Scripts/python.exe` en lugar de `.\.venv\Scripts\python.exe`.

La CLI y los experimentos **escriben resultados**. Cada ejecución de experimentos crea `results/evidence_<fecha UTC>_<id>/`, con 15 ejecuciones nuevas y `summary.json`. Los resultados tienen escenario, semilla, parámetros, métricas, historia y duración; el fallo de generación conserva contexto y mensaje. Los archivos se crean en modo exclusivo con microsegundos y UUID para evitar sobrescrituras. pytest usa directorios temporales para comprobar exportaciones.

Prueba opcional de navegador Chromium instalado, sin instalar bibliotecas:

```powershell
node tests/browser_check.cjs results/browser_demo "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

Inicia un servidor temporal en 5057 y un navegador sin ventana con depuración en 9227; ambos puertos deben estar libres. Guarda un informe y, si logra ejecutarse, capturas y descargas. Usa un perfil aislado bajo `results/temp/` (ignorado por Git). El informe distingue comprobaciones aprobadas y fallos; no se debe considerar una prueba visual aprobada por la mera existencia del script.

## Documentación y evidencia

- [Modelo, límites y estados](docs/definicion_problema.md).
- [Pruebas ejecutadas y pendientes](docs/pruebas.md).
- [Análisis de experimentos nuevos](docs/analisis_resultados.md).
- [Resumen de las ejecuciones registradas](results/evidence_20261025_032443_774927_fa6eaea1/summary.json).
- [Comprobación real de la API por HTTP](results/evidence_20261025_032443_774927_fa6eaea1/http/http_report.json).

## Uso real de IA y autoría

Esta ronda de correcciones fue realizada con apoyo de Codex: revisión del repositorio, propuestas y edición de código, pruebas, ejecución de experimentos y redacción de documentación. Las comprobaciones ejecutadas se detallan en `docs/pruebas.md`; no se atribuyen a integrantes verificaciones manuales que no estén confirmadas. El historial previo tiene dos commits atribuidos por Git a `javistravis7`; no prueba autoría individual de cada línea ni permite establecer qué herramientas se usaron antes. Un commit creado con la identidad local configurada registra esa identidad, no una verificación manual del titular.
