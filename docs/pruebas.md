# Pruebas y evidencias reales

Fecha local: 24 de octubre de 2026 (America/Cancun). Los nombres y marcas temporales de los archivos usan UTC: las ejecuciones de esta ronda comienzan el 25 de octubre a las 03:24 UTC, todavía 24 de octubre en Cancún.

## Qué está escrito y qué se ejecutó

La suite Python contiene 76 casos y fue ejecutada: **76 aprobados**. La suite de comportamiento JavaScript contiene seis pruebas y fue ejecutada: **seis aprobadas**. No son pruebas de renderizado: sustituyen DOM, red y WebGL para ejercitar los manejadores reales de la aplicación.

Entorno: Python 3.14.0, Flask 3.1.3, pytest 8.4.2 y Node 24.11.0. Se usó el entorno existente; no se instalaron dependencias. El tiempo de la ejecución Python final con reporte fue 1.08 s; es una medición local, no una garantía de rendimiento.

| Evidencia | Prueba / experimento | Resultado verificado |
|---|---|---|
| Estructura y ocho satélites | `test_validation_api.py` | Rechaza listas vacías, seis/nueve posiciones, estructura incompleta, IDs vacíos/duplicados y coordenadas inválidas |
| API inválida | `test_validation_api.py` | 400 para listas vacías, radios fuera de dominio, pesos inválidos, NaN/infinito, booleanos numéricos, tipos incorrectos, JSON mal formado y exceso de tamaño |
| Estados | `test_validation_api.py`, `test_evolution.py` | Completo/parcial/espacialmente inválido y fallo de generación diferenciados |
| Evolución y semillas | `test_evolution.py` | Elitismo no decreciente, generación cero, copia del escenario, semilla repetible y operadores que cambian posiciones sin modificar padres |
| Tres zonas y dos objetos | Cinco casos parametrizados en `test_evolution.py` | Cada centro es inválido; generar cerca de cada exclusión produce alternativas válidas |
| Espacio reducido | `test_reduced_space_and_priority_scoring` y cinco experimentos | No cubre Yucatán; mantiene posiciones válidas |
| Condición bloqueada admitida | `test_admitted_spatially_blocked_scenario_stops` y experimento | Dos exclusiones antipodales de 100°; fallo controlado, sin reintentos ilimitados |
| Semilla no proporcionada | `test_resolved_random_seed_can_be_replayed` | La semilla generada queda registrada y permite repetir posiciones e historia |
| Línea de cambio de fecha | `test_dateline_and_coverage_threshold_additional` | 179° a −179° sobre el ecuador equivale a aproximadamente 2° |
| Prueba adicional propia | Mismo caso de umbral de cobertura | 299.999 km cubre; 300.001 km no cubre |
| Exportaciones | `test_export_twice_preserves_both` | Dos guardados consecutivos conservan ambos contenidos |
| Peticiones simultáneas y recuperación | `test_api_sampling_failure_and_lock_recovery` | API devuelve 409 estando ocupada y permite una petición posterior al fallo |
| Vistas y coherencia | `tests/ui.test.cjs` | Botones inicial/final actualizan métricas, tabla, leyenda y llamada al globo; conservan la curva completa y el escenario del resultado |
| Comparación de cinco semillas | `tests/ui.test.cjs` | Controles bloqueados durante las cinco peticiones; botones de cambios y ejecuciones adicionales no alteran la comparación |
| Fallos de red y resultados anteriores | `tests/ui.test.cjs` | Restaura controles, conserva el resultado anterior identificado y deshabilita la vista inicial si faltan sus métricas |
| Exclusiones con nombres repetidos | Suite Python y JavaScript | Los IDs distinguen las zonas; solo se marca la exclusión realmente infringida |

La prueba de exportación y las peticiones exitosas del cliente Flask escriben únicamente en directorios temporales de pytest. No sustituyen los experimentos completos guardados.

## Resultados guardados

Carpeta de esta ronda: [`results/evidence_20261025_032443_774927_fa6eaea1`](../results/evidence_20261025_032443_774927_fa6eaea1/).

- `summary.json`: índice de 15 ejecuciones reales, parámetros, duración, estado, primera generación completa, entorno y contexto de Git.
- 15 JSON individuales: cinco semillas base (42–46), repetición de 42, cinco semillas con espacio reducido (42–46), cambio de prioridades con espacio reducido, dos tasas de mutación y un fallo espacial de generación. Incluyen posiciones, métricas iniciales/finales e historia cuando existe resultado; el fallo conserva parámetros y escenario.
- `pytest.xml`: reporte real de las 76 pruebas Python.
- `ui-tests.tap`: reporte real de las seis pruebas JavaScript.
- `source_manifest.json`: huellas SHA-256 del código y las pruebas. El `git_head` del resumen identifica el commit base existente durante los experimentos, cuando las correcciones aún estaban sin registrar; las huellas identifican los archivos entregados.
- `evidence_verification.json`: las 15 evidencias se contrastaron con el evaluador actual; métricas iniciales/finales y extremos del historial coinciden.
- `http/http_report.json`: ocho comprobaciones mediante un servidor Flask real en localhost (no solo el cliente simulado): cuatro rutas GET con 200, optimización con 200 y ocho satélites, regiones vacías con 400, servidor ocupado con 409 y generación bloqueada con 422. El resultado HTTP exitoso también quedó guardado dentro de `http/`.
- `browser/browser_report.json` y `browser_edge/browser_report.json`: intentos de comprobación real del navegador que **no finalizaron**. Ambos se detuvieron en `CDP timeout: Page.enable`, antes de verificar la aplicación. No son evidencia de renderizado aprobado ni demuestran por sí solos un defecto de AstroShield.

Los JSON originales en la raíz de `results/` permanecen intactos. No se copiaron sus métricas ni los números de la auditoría como si fueran experimentos nuevos.

## Comprobación de navegador: pendiente

Se intentó utilizar Chrome y Edge instalados, en modo sin ventana y con perfil aislado. El canal de control no respondió a la activación de la página. La ejecución fuera del sandbox no fue autorizada, por lo que no se insistió. El script reproducible `tests/browser_check.cjs` guarda el fallo con honestidad.

Queda pendiente verificar en un navegador operativo: carga del módulo y fuentes CDN, renderizado de ocho satélites y las cinco exclusiones, colores de cobertura inicial/final, arrastre, rueda/zoom, descarga real del navegador y revisión visual de que la apariencia se conserva. Los estilos CSS y la construcción de tierra, estrellas, iluminación y materiales no fueron rediseñados.

## Reproducir

Desde la raíz, PowerShell:

```powershell
.\.venv\Scripts\python.exe -B -m pytest -q -p no:cacheprovider
node --test tests/ui.test.cjs
node --check web/js/app.js
.\.venv\Scripts\python.exe -B -m src.experiments
```

El último comando crea una carpeta nueva y 15 ejecuciones nuevas; no sobrescribe esta evidencia. En Git Bash sustituye el ejecutable por `./.venv/Scripts/python.exe`. Para generar el reporte XML añade `--junitxml=<ruta-nueva>.xml`. La instalación y la demostración están en el README.
