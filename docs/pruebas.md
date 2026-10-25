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

## Condiciones, resultados e interpretación — entregable 3

La siguiente lectura conserva las evidencias anteriores y explicita los tres elementos que Classroom pide para cada prueba. «Escenario base» incluye las cinco exclusiones originales; no se presenta como una ejecución histórica anterior a incorporarlas. Salvo donde se indica otra cosa, los experimentos usan ocho satélites, 120 generaciones, población 70, mutación 0.22 y radio 300 km. Los archivos individuales conservan las coordenadas y métricas; no se deducen resultados únicamente de la imagen del globo.

| Prueba exigida | Condiciones y evidencia | Resultado real | Interpretación |
|---|---|---|---|
| Escenario inicial | Semilla 42, escenario base; [resultado base][base42], campos `initial`, `initial_metrics`, `best`, `metrics` | La mejor inicial cubre Yucatán, Amazonía, California, Sahel y Japón; falta Australia: 92.31%. La final cubre las seis: 100%; ambas válidas | La búsqueda mejora una configuración ya buena. «Inicial» significa la mejor de 70, no una muestra aislada |
| Evolución | Mismo [resultado base][base42], campo `history` | 121 registros: aptitud 92.3077 en generación 0 y 100 desde generación 1 | Hay una mejora registrada antes de la meseta. No se infiere optimalidad global de que después deje de mejorar |
| Tres zonas restringidas | Prueba `test_each_exclusion_affects_generation_and_validation`, casos `atlantic`, `south_pacific`, `north_polar`; semilla 42 y 25 puntos por caso, dirigidos alrededor de cada centro; [código][evolution-test] y [reporte][pytest-report] | Cada centro se rechaza; los 25 puntos generados por caso cumplen las cinco exclusiones y hay más de una posición distinta | Las zonas afectan a la generación, además de la validación; estos casos son de posiciones, complementados por las constelaciones válidas guardadas |
| Dos posiciones ocupadas | Misma prueba y condiciones, casos `object_a` y `object_b`; [código][evolution-test] y [reporte][pytest-report] | Sus centros se rechazan y los 25 puntos por caso son válidos y no todos iguales | Los objetos existentes tienen efecto real en la búsqueda y no son solo marcadores gráficos |
| Espacio reducido | Semilla 42 y exclusión adicional de 6° sobre Yucatán; [resultado reducido][reduced42]. También se ejecutaron semillas 43–46 | 5/6 regiones; falta Yucatán; 76.92% de cobertura ponderada, aptitud 76.9231, cero infracciones | Mantener validez puede exigir renunciar a un objetivo bloqueado. La cobertura parcial no es éxito completo |
| Condición difícil o inviable | Semilla 42, dos generaciones, población 4 y dos exclusiones antipodales de 100°; [fallo guardado][blocked] | `generation_failed`, con escenario y parámetros, sin posiciones finales inventadas | El programa termina sin reintentos ilimitados. La geometría explica este bloqueo particular; el mensaje de muestreo no constituye un demostrador general de inviabilidad |
| Variación entre ejecuciones | Semillas 42–46, mismas condiciones base; [resumen][summary] | Cinco configuraciones finales distintas, todas válidas con 100. Semillas 43–46 ya comienzan en 100. Repetir 42 reproduce posiciones e historia | La puntuación final coincide, pero el recorrido y las posiciones varían. Cinco muestras no garantizan robustez universal |
| Prueba adicional propia | `test_dateline_and_coverage_threshold_additional`; región en (0°,0°), peso 1, ocho posiciones a 299.999 km o 300.001 km, IDs distintos; [código][evolution-test] y [reporte][pytest-report] | El primer caso cubre y el segundo no. Además, la distancia angular entre (0°,179°) y (0°,−179°) es aproximadamente 2° | El umbral depende de la distancia esférica, no del aspecto de la imagen ni de restar longitudes sin considerar la línea de cambio de fecha |

Los casos Python y JavaScript se ejecutaron nuevamente durante esta revisión documental: 76 y seis aprobados, respectivamente, sin reemplazar los reportes guardados ni crear otro lote de resultados. Los valores de la tabla proceden de los JSON y pruebas indicados. Las condiciones que cambian prioridades, la comparación de mutación y los límites de interpretación se conservan en el [análisis](analisis_resultados.md).

### Cambio de escenario sobre una solución ya calculada

Además de revisar búsquedas nuevas, se reevaluó en memoria la configuración `best` del [resultado base de semilla 42][base42], sin modificar sus coordenadas: bajo las exclusiones originales sigue válida; al cambiar solo prioridades también; al añadir la exclusión de Yucatán, `SAT-03` la invade y la configuración se vuelve inválida. La cobertura geométrica sigue en 100%, pero la aptitud baja a 80 y el estado es `invalid`. Esta comprobación usa `evaluate_constellation` con una copia del escenario; no es una nueva ejecución evolutiva ni altera el JSON fuente. El [análisis de esta revalidación](analisis_resultados.md#revalidación-de-una-configuración-anterior--classroom-33) explica por qué no basta conservar una puntuación alta.

### Qué falta para acreditar todos los entregables

| Entregable de Classroom | Ubicación y alcance comprobado |
|---|---|
| 1. Definición del problema | [Definición y justificación](definicion_problema.md): representación, cobertura, aptitud, invalidez, operadores, parámetros y objetivo suficiente. No se acredita retrospectivamente que se redactara antes de programar |
| 2. Implementación funcional | Código `src/`, `app.py` y `web/`; pruebas automáticas y reporte HTTP enlazados arriba. Esta revisión no modifica la implementación |
| 3. Pruebas y validación | Este documento, tabla de condiciones/resultados/interpretación, reportes y JSON existentes |
| 4. Análisis de resultados | [Análisis](analisis_resultados.md): evolución, semillas, restricciones, prioridades, fallo y comparación justificada de soluciones |
| 5. Visualización 3D | Código y pruebas de comportamiento disponibles; sigue pendiente la verificación real del renderizado, giro, cobertura y correspondencia visual, según los informes de navegador fallidos |
| 6. Repositorio y presentación | [README](../README.md): instalación, ejecución y demostración. El historial registra cambios; la explicación y demostración de cada integrante aún debe realizarse, sin inventar aportaciones ni reconstruir artificialmente commits |

La rúbrica asigna 40% a funcionamiento, 25% a pruebas, 20% a comprensión/personalización y 15% a organización/Git. Esta tabla organiza evidencias, no asigna una calificación ni da por aprobada la parte visual pendiente. Se conserva el diseño actual; justificarlo durante la presentación no requiere rediseñar la aplicación.

[base42]: ../results/evidence_20261025_032443_774927_fa6eaea1/astroshield_20261025_032445_043774_9e6a03920be9490e928d460540353e90.json
[reduced42]: ../results/evidence_20261025_032443_774927_fa6eaea1/astroshield_20261025_032451_614816_9f1f5ab5a0574185b635abacd88eee96.json
[blocked]: ../results/evidence_20261025_032443_774927_fa6eaea1/astroshield_20261025_032459_539784_db01b93dfdd34517a3a7676b4f508cf7.json
[summary]: ../results/evidence_20261025_032443_774927_fa6eaea1/summary.json
[evolution-test]: ../tests/test_evolution.py
[pytest-report]: ../results/evidence_20261025_032443_774927_fa6eaea1/pytest.xml
