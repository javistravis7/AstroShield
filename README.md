# AstroShield // Orbital Intelligence

AstroShield busca una configuración de **ocho satélites** que observe seis regiones terrestres y respete cinco exclusiones espaciales. Usa un algoritmo evolutivo en Python y presenta las posiciones calculadas, su cobertura y su evolución en una aplicación web con globo 3D.

Es una **simulación educativa**: cada satélite representa un punto geográfico de observación, no una órbita real. Sirve para explicar búsqueda, prioridades y restricciones; no predice trayectorias ni garantiza cobertura continua en el tiempo.

## 1. Tecnologías y requisitos

| Componente | Uso y requisito real |
|---|---|
| Python | 3.10 o superior según el proyecto; entorno comprobado con 3.14.0 |
| Flask | Servidor y API local; `Flask>=3.0,<4.0` |
| pytest | Pruebas Python; `pytest>=8.0,<9.0` |
| HTML, CSS y JavaScript | Interfaz; no hay compilación ni instalación con npm |
| Three.js | Versión 0.164.1 importada desde jsDelivr; requiere navegador con WebGL |
| Fuentes web | IBM Plex Mono y Orbitron desde Google Fonts |
| Node.js | Solo para las pruebas JavaScript y el comprobador opcional de navegador; comprobado con 24.11.0 |
| Git | Historial y contexto de las evidencias; no es necesario para servir la aplicación |

Las dependencias Python están en [requirements.txt](requirements.txt). Hace falta conexión para instalarlas y para cargar Three.js y las fuentes. El algoritmo por terminal no depende del CDN. Node no es necesario para ejecutar Flask o usar la web.

## 2. Instalar y ejecutar en Windows

### PowerShell

1. Abre una terminal en la carpeta que contiene `app.py`, `requirements.txt` y este README. Esta es la ruta del espacio de trabajo actual; ajústala si guardaste el proyecto en otro lugar.

```powershell
cd "C:\Practica 1\AstroShield"
python --version
```

2. Crea el entorno si todavía no existe e instala las dependencias. No hace falta recrear un `.venv` existente que ya funcione.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

3. Inicia el servidor usando el Python del proyecto:

```powershell
.\.venv\Scripts\python.exe app.py
```

### Git Bash

Los mismos pasos usan barras `/` y la unidad de Windows se escribe `/c/`:

```bash
cd "/c/Practica 1/AstroShield"
python --version
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt
./.venv/Scripts/python.exe app.py
```

### Abrir y detener la aplicación

Abre **http://127.0.0.1:5000** y mantén la terminal abierta. `Ctrl+C` detiene el servidor. No abras `web/index.html` directamente: necesita las rutas de Flask. El servidor escucha solo en la computadora local y no se inicia en modo depuración.

No necesitas activar el entorno. Si prefieres hacerlo, usa `.\.venv\Scripts\Activate.ps1` en PowerShell o `source .venv/Scripts/activate` en Git Bash, y después `python app.py`. Si PowerShell bloquea la activación, usa los comandos con la ruta completa del ejecutable indicados arriba, sin cambiar la política de ejecución.

## 3. Estructura del proyecto

```text
AstroShield/
├── app.py                       # Servidor Flask y rutas de la API
├── requirements.txt             # Dependencias Python
├── src/
│   ├── main.py                  # Ejecutar el optimizador desde terminal
│   ├── experiments.py           # Ejecutar y guardar los 15 experimentos
│   ├── core/
│   │   ├── validation.py        # Tipos, rangos y estructura admitidos
│   │   ├── constraints.py       # Distancias esféricas y exclusiones
│   │   ├── fitness.py           # Cobertura, aptitud y estado de la solución
│   │   └── genetic_algorithm.py # Población y ciclo evolutivo
│   ├── data/scenario.py         # Ocho satélites, regiones y exclusiones originales
│   └── visualization/exporter.py # Guardado seguro de resultados JSON
├── web/
│   ├── index.html              # Pantalla y controles
│   ├── css/styles.css          # Diseño visual existente
│   └── js/app.js               # API, vistas, globo Three.js, curva y descargas
├── tests/                      # Pruebas Python, JavaScript y navegador opcional
├── docs/                       # Modelo, pruebas y análisis detallados
└── results/                    # Resultados JSON y carpetas de evidencias
```

Los archivos `__init__.py` identifican los paquetes Python. `.venv/`, cachés y `results/temp/` están ignorados por Git. El `package-lock.json` local no define dependencias de esta aplicación; no se requiere `npm install` ni `npm run dev`.

## 4. Qué se representa

### Constelación y regiones

Una configuración contiene exactamente ocho satélites con identificador único y coordenadas `{id, lat, lon}`, por ejemplo `SAT-01`. La latitud debe estar entre −90° y 90°, y la longitud entre −180° y 180°. Las posiciones deben ser finitas; se permite que dos satélites distintos compartan coordenadas.

Una región queda cubierta cuando al menos un satélite está a **300 km o menos de su centro**, usando distancia de círculo máximo sobre una esfera de radio 6371 km. No significa cubrir toda una superficie regional de 300 km de radio. Las coordenadas se expresan en grados; latitud negativa indica sur y longitud negativa indica oeste.

| Región original | Latitud | Longitud | Prioridad | Peso |
|---|---:|---:|---|---:|
| Península de Yucatán | 20.5° | −89.0° | Alta | 3 |
| Amazonía brasileña | −3.5° | −62.0° | Alta | 3 |
| California | 36.8° | −119.4° | Media | 2 |
| Sahel | 15.0° | 0.0° | Media | 2 |
| Japón | 36.0° | 138.0° | Media | 2 |
| Interior de Australia | −25.0° | 133.0° | Normal | 1 |

### Cinco exclusiones originales

| Exclusión | Tipo | Latitud | Longitud | Radio angular |
|---|---|---:|---:|---:|
| Atlántico Norte | Zona restringida | 45° | −35° | 12° |
| Pacífico Sur | Zona restringida | −30° | −120° | 10° |
| Región polar norte | Zona restringida | 78° | 30° | 8° |
| Objeto A | Posición ocupada | 10° | 45° | 5° |
| Objeto B | Posición ocupada | −15° | 110° | 5° |

Una posición estrictamente dentro de cualquiera de esos radios está prohibida; el borde se acepta, sujeto al redondeo numérico. Estos radios están en **grados**, no en kilómetros. Se restringe la posición del satélite, no la intersección de su cobertura con una zona.

La fuente de estos datos es [scenario.py](src/data/scenario.py). El dominio completo de entradas y los supuestos están en la [definición del problema](docs/definicion_problema.md).

## 5. Cómo funciona el algoritmo

1. **Población:** crea por defecto 70 configuraciones de ocho satélites. El 82% de los intentos de posición se dirige alrededor de una región elegida al azar, con desviación de 2°; el 18% explora latitud y longitud globales. Se rechazan las posiciones prohibidas. Este sesgo facilita encontrar objetivos pequeños; no es un muestreo uniforme en superficie.
2. **Evaluación:** calcula cobertura ponderada, infracciones, aptitud y validez. La configuración INICIAL es la mejor de la población inicial, no un individuo aleatorio aislado.
3. **Selección:** organiza la población por aptitud y realiza torneos de tres candidatos entre la mitad superior, con al menos cuatro candidatos disponibles.
4. **Cruce:** corta entre dos de los ocho genes y combina posiciones de dos padres, reasignando los IDs por orden.
5. **Mutación:** cada satélite puede reemplazar su posición por otra generada y válida, según la tasa configurada.
6. **Elitismo:** conserva los dos mejores individuos de cada generación y mantiene el mejor histórico; un empate no lo sustituye.
7. **Finalización:** completa las generaciones solicitadas, incluso si ya cubre todas las regiones. Registra la generación cero antes de reproducirse: 120 generaciones producen 121 puntos en la curva.

Si no encuentra una posición válida tras 500 intentos, prueba los centros regionales. Si también fallan, cancela con `generation_failed`. Ese límite evita reintentos ilimitados, pero **no demuestra inviabilidad matemática**. No hay una regla de parada por estancamiento ni por llegar a 100.

La curva representa la mejor aptitud acumulada de la ejecución completa. Puede comenzar en 100 porque ya existía una solución completa en la población inicial; una curva plana no demuestra por sí sola un óptimo global.

## 6. Parámetros y reproducibilidad

| Parámetro | Inicial | Control de la web | Núcleo / API / CLI |
|---|---:|---|---|
| Generaciones | 120 | 10–300, paso 10 | Entero 1–1000 |
| Población | 70 | 20–140, paso 10 | Entero 4–300 |
| Mutación por satélite | 0.22 | 0.05–0.60, paso 0.01 | Número 0–1 |
| Semilla | Vacía / aleatoria | Campo numérico opcional | Entero 0–4294967295 u omitida; la API admite `null` |
| Satélites | 8 | Fijo | La actividad exige exactamente 8 |
| Radio de observación | 300 km | Fijo | Fijo en el optimizador y la CLI |

La API usa `population_size` y `mutation_rate`; la CLI usa `--population` y `--mutation`. Las listas de regiones y exclusiones pueden cambiarse mediante la API o experimentos Python, no mediante un editor arbitrario en pantalla. Consulta los [límites de validación](docs/definicion_problema.md#dominio-admitido).

Al dejar vacía la semilla de una ejecución individual se genera una y se guarda como `parameters.seed`; `requested_seed` conserva lo solicitado. Para repetir posiciones, métricas e historia utiliza la misma semilla efectiva, escenario, parámetros y versión del código y entorno. El mismo número no garantiza resultados idénticos entre versiones del algoritmo. Las estrellas decorativas del globo usan otro azar y no forman parte de la reproducibilidad del optimizador.

### Ejecutar solo el algoritmo por terminal

PowerShell:

```powershell
.\.venv\Scripts\python.exe -m src.main --generations 120 --population 70 --mutation 0.22 --seed 42
```

Git Bash:

```bash
./.venv/Scripts/python.exe -m src.main --generations 120 --population 70 --mutation 0.22 --seed 42
```

Muestra estado, semilla, aptitud, cobertura y ruta del JSON que **guarda en `results/`**. No inicia la web ni carga automáticamente el archivo en el globo. Usa `-m src.main --help` para consultar sus opciones; ejecuta siempre desde la raíz del proyecto.

## 7. Guía de los controles

| Control | Comportamiento implementado |
|---|---|
| EJECUTAR OPTIMIZACIÓN | Envía parámetros y escenario al servidor; muestra el resultado y guarda un JSON |
| INICIAL / FINAL | Cambia posiciones, cobertura, métricas, tabla, leyenda y validaciones; la curva sigue siendo la de toda la ejecución |
| PRUEBA ESPACIO REDUCIDO | Añade o retira una exclusión de 6° sobre el centro de Yucatán y ejecuta nuevamente |
| CAMBIAR PRIORIDADES | Alterna Yucatán de Alta/3 a Normal/1 y Australia de Normal/1 a Alta/3; vuelve a ejecutar |
| RESTAURAR ESCENARIO | Recupera las regiones, prioridades y exclusiones originales cargadas al abrir la página y vuelve a ejecutar; no reinicia los parámetros ni la semilla |
| COMPARAR 5 SEMILLAS | Ejecuta secuencialmente la semilla escrita y sus cuatro sucesoras con una copia del mismo escenario y parámetros; deja visible la última y descarga los cinco resultados completos |
| EXPORTAR JSON | Descarga `astroshield_resultado.json`, con posiciones iniciales/finales, métricas, parámetros, escenario e historia de la última ejecución; no exporta solo la vista seleccionada |
| CENTRAR | Restablece orientación y zoom del globo y reactiva su rotación automática |
| LIMPIAR | Limpia el registro visible; no borra resultados guardados |

La comparación con semilla vacía usa **100, 101, 102, 103 y 104**. Para comparar desde otro valor, usa como máximo 4294967291, de modo que las cinco semillas sean admitidas. La comparación descarga `astroshield_comparacion_semillas.json`; cada una de sus optimizaciones también se guarda en el servidor.

Durante una ejecución o comparación se bloquean parámetros y cambios de escenario. Al terminar o fallar se restauran los controles. Ante un fallo se conserva la última ejecución identificada en pantalla; el registro informa el error. La API permite una optimización a la vez por proceso y devuelve 409 si está ocupada.

El globo tiene manejadores de arrastre y rueda para rotación y zoom. Su comprobación visual real sigue pendiente; las pruebas JavaScript verifican comportamiento con sustitutos de DOM, red y globo, no imágenes WebGL.

## 8. Cómo interpretar los resultados

| Indicador / estado | Significado |
|---|---|
| Regiones cubiertas | Cuenta de centros regionales a ≤300 km de algún satélite, sin ponderar |
| Cobertura ponderada | `100 × suma de pesos cubiertos / suma de todos los pesos`; cada región cuenta una sola vez |
| Aptitud | `cobertura ponderada (%) − 20 × número de satélites con infracciones`; puede ser negativa |
| VÁLIDA | La constelación cumple estructura, ocho satélites y exclusiones; no implica cobertura completa |
| `complete` / OBJETIVO CUMPLIDO | Configuración válida que cubre todas las regiones |
| `partial` / VÁLIDA-PARCIAL | Configuración válida con regiones sin cubrir; puede devolver HTTP 200 porque la ejecución terminó correctamente |
| `invalid` | Hay infracciones espaciales; una puntuación alta no las compensa. Las estructuras mal formadas se rechazan antes de evaluar |
| `generation_failed` | No se pudo generar una posición en el presupuesto de intentos; la API devuelve 422 |

Los pesos originales suman 13. Perder solo Yucatán deja `10/13 × 100 = 76.92%` de cobertura ponderada, aunque se cubran cinco de seis regiones. La validez y la cobertura responden preguntas distintas.

## 9. Demostración breve con semilla 42

Con el servidor abierto, establece 120 generaciones, población 70 y mutación 0.22:

1. Escribe **42** y pulsa RESTAURAR ESCENARIO para asegurar las prioridades y exclusiones originales; ese botón ya ejecuta la optimización.
2. Alterna INICIAL y FINAL y revisa la curva, la tabla y las restricciones. La evidencia guardada registra aptitud inicial 92.3077 y final 100, con cobertura final 6/6 y cero infracciones.
3. Pulsa PRUEBA ESPACIO REDUCIDO. Con la misma semilla, la evidencia registra 5/6 regiones, cobertura ponderada 76.92%, aptitud 76.9231 y configuración válida. Yucatán queda sin cubrir porque la exclusión de 6° engloba toda su distancia de observación de aproximadamente 2.70°.
4. Opcionalmente cambia prioridades: en el experimento reducido registrado la puntuación sube a 92.3077, pero las posiciones son las mismas. Esto demuestra un cambio de valoración, no una redistribución espacial.
5. Restaura el escenario, compara cinco semillas y exporta el resultado. La exportación individual corresponde a la última ejecución, que tras comparar desde 42 usa semilla 46.

Estos números proceden de [experimentos existentes](results/evidence_20261025_032443_774927_fa6eaea1/summary.json), no de una nueva prueba visual ni de una garantía para cualquier versión del programa. El [análisis](docs/analisis_resultados.md) explica las diferencias entre semillas, las curvas que empiezan en 100 y los límites de estas conclusiones.

## 10. Pruebas y experimentos

### Pruebas automatizadas

PowerShell:

```powershell
.\.venv\Scripts\python.exe -B -m pytest -q -p no:cacheprovider
node --test tests/ui.test.cjs
node --check web/js/app.js
```

Git Bash:

```bash
./.venv/Scripts/python.exe -B -m pytest -q -p no:cacheprovider
node --test tests/ui.test.cjs
node --check web/js/app.js
```

En esta revisión del README se ejecutaron de nuevo: **76 pruebas Python aprobadas**, **seis pruebas JavaScript aprobadas** y comprobación sintáctica JavaScript sin errores. También se comprobaron las ayudas de la CLI y de experimentos. No se instalaron dependencias ni se generaron nuevas evidencias dentro del repositorio; pytest prueba exportaciones en directorios temporales.

La suite cubre validación, las cinco exclusiones, evolución, reproducibilidad, operadores, cobertura parcial, fallo de generación, cruce de la línea de cambio de fecha, umbral de 300 km, guardados consecutivos y comportamiento de los controles. El detalle y los reportes previos están en [pruebas y evidencias](docs/pruebas.md).

### Crear un nuevo lote de experimentos

Este comando **escribe resultados**. No es necesario para iniciar la aplicación ni para consultar las evidencias ya guardadas.

```powershell
.\.venv\Scripts\python.exe -B -m src.experiments
```

En Git Bash:

```bash
./.venv/Scripts/python.exe -B -m src.experiments
```

Crea una carpeta nueva `results/evidence_<fecha UTC>_<id>/` con 15 ejecuciones y `summary.json`: cinco semillas base, repetición de 42, cinco semillas con espacio reducido, prioridades cambiadas, dos tasas de mutación y un escenario bloqueado mediante dos exclusiones admitidas de 100°. Admite `--output-root` para elegir otra carpeta base; no admite configurar semillas o generaciones por argumentos.

### Comprobador opcional de navegador

Con Node y Chrome instalado en la ruta indicada, desde la raíz:

```powershell
node tests/browser_check.cjs results/browser_demo "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

La misma línea funciona en Git Bash. Ajusta la ruta si el navegador está en otra ubicación y elige otra carpeta de salida para una prueba nueva. El script inicia Flask temporalmente en 5057 y un navegador sin ventana con depuración en 9227; ambos puertos deben estar libres. Usa `.venv/Scripts/python.exe` por defecto y un perfil aislado bajo `results/temp/`. Guarda un informe y, si las comprobaciones llegan a realizarse, capturas y descargas.

Los intentos registrados con Chrome y Edge terminaron en `CDP timeout: Page.enable`, antes de comprobar la aplicación. **No hay verificación visual aprobada** de carga, ocho satélites renderizados, arrastre, zoom ni descarga real. La existencia del script no demuestra que esas pruebas hayan pasado.

## 11. Resultados, evidencias y documentación

Para revisar la entrega frente a Classroom, consulta la [correspondencia de los seis entregables y sus pendientes](docs/pruebas.md#qué-falta-para-acreditar-todos-los-entregables). La [definición](docs/definicion_problema.md#justificación-técnica-del-modelo-actual--entregable-1) explica las decisiones del modelo; las [pruebas](docs/pruebas.md#condiciones-resultados-e-interpretación--entregable-3) registran condiciones, resultados e interpretación; el [análisis](docs/analisis_resultados.md#qué-evidencia-permite-comparar-soluciones--entregable-4) explica qué comparaciones permiten defender una solución. Allí se documenta también si una configuración anterior sigue siendo válida al cambiar las restricciones, sin duplicar aquí las explicaciones especializadas.

| Ubicación | Contenido |
|---|---|
| [Definición del problema](docs/definicion_problema.md) | Fórmulas, supuestos, límites de entradas, operadores y estados |
| [Pruebas](docs/pruebas.md) | Casos ejecutados, reportes y comprobaciones pendientes |
| [Análisis de resultados](docs/analisis_resultados.md) | Interpretación de ejecuciones reales y limitaciones |
| [Lote de evidencias registrado](results/evidence_20261025_032443_774927_fa6eaea1/) | 15 experimentos, reportes Python/JavaScript y huellas del código |
| [summary.json](results/evidence_20261025_032443_774927_fa6eaea1/summary.json) | Índice de experimentos, escenarios identificables por archivo, parámetros, duración y entorno |
| [Reporte HTTP](results/evidence_20261025_032443_774927_fa6eaea1/http/http_report.json) | Ocho comprobaciones previas con servidor real: rutas y respuestas 200, 400, 409 y 422 |
| `results/astroshield_*.json` | Resultados individuales de diferentes ejecuciones; algunos son anteriores al formato actual |

Los resultados nuevos usan `schema_version: 2` e incluyen `initial`, `best`, `initial_metrics`, `metrics`, `history`, `parameters` y `scenario`. Los fallos de generación guardados por los experimentos contienen estado, error, parámetros y escenario, sin inventar posiciones. La duración se añade en los experimentos; no es un campo garantizado en toda ejecución individual.

El servidor y la CLI guardan nombres con fecha UTC, microsegundos y UUID, en modo de creación exclusiva. Los nombres UTC pueden corresponder al día siguiente de la fecha local de Cancún. Las descargas del navegador tienen nombres fijos y se guardan según la configuración del navegador; esa política es independiente del guardado único del servidor.

No existe un botón para importar JSON al globo ni un historial persistente en pantalla: conserva tus exportaciones antes de cerrar o recargar. Los JSON antiguos pueden carecer de métricas iniciales o semilla reproducible. El código deshabilita la comparación inicial si falta `initial_metrics`, y no puede visualizar fiablemente un resultado sin escenario.

## 12. Problemas frecuentes y limitaciones

| Situación | Qué revisar o hacer |
|---|---|
| `python` o `node` no se reconoce | Comprueba que el ejecutable esté instalado y disponible en la terminal. Las versiones comprobadas están en requisitos; esta revisión no ejecutó una instalación desde cero |
| No encuentra `app.py`, `src` o `requirements.txt` | Vuelve a la raíz `AstroShield`; los comandos y el guardado de resultados dependen del directorio de trabajo |
| `ModuleNotFoundError` de Flask o pytest | Instala `requirements.txt` con el Python de `.venv` y ejecuta usando ese mismo intérprete |
| PowerShell impide activar `.venv` | Usa `.\.venv\Scripts\python.exe` directamente; es la ruta usada para las verificaciones |
| La web no abre o deja de responder al cerrar la terminal | Inicia o conserva activo `app.py` y usa http://127.0.0.1:5000; abrir el HTML como archivo no inicia la API |
| Puerto 5000 ocupado | Revisa si dejaste otra instancia propia de AstroShield y detenla con `Ctrl+C` en su terminal. `app.py` no tiene argumento `--port` |
| Globo vacío o error de inicialización | Revisa consola del navegador, WebGL y acceso a jsDelivr y Google Fonts. La causa concreta y su solución visual no están confirmadas por los reportes disponibles |
| Datos rechazados / HTTP 400 | Respeta tipos y límites; no envíes regiones vacías, radios mayores de 180°, NaN, infinito ni cadenas donde se piden números. Estos rechazos están probados |
| HTTP 409 | Hay otra optimización en curso en ese proceso; espera a que termine. El bloqueo y la recuperación están probados |
| HTTP 422 / fallo de generación | El muestreo no encontró posiciones admitidas. Revisa restricciones o prueba otra semilla; no lo interpretes como demostración general de inviabilidad |
| VÁLIDA pero solo 5/6 regiones | No es una contradicción: validez mide exclusiones y cobertura mide objetivos. En el escenario reducido es el resultado registrado |
| Curva plana desde 100 | La mejor configuración inicial ya cubría todas las regiones; no significa que se haya demostrado un óptimo orbital |
| Comparación falla con una semilla muy grande | Sucesoras mayores de 4294967295 no se admiten; empieza como máximo en 4294967291 |

Las soluciones de rutas, validación y estados se apoyan en el código y las pruebas; los problemas de instalación limpia, puerto ocupado y CDN son indicaciones de diagnóstico, no incidentes reproducidos en esta revisión.

El modelo no incluye altitud, dinámica orbital, periodos, consumo ni cobertura temporal. Tampoco impone distancia mínima entre satélites nuevos. El muestreo dirigido y la evaluación por centros simplifican mucho el problema; unas pocas semillas no prueban robustez en todos los escenarios. El bloqueo del servidor es por proceso, no entre múltiples servidores; Flask se usa aquí como aplicación educativa local.

## 13. Uso de IA y verificaciones realizadas

Codex apoyó la auditoría, las correcciones previas de código, las pruebas, la ejecución de experimentos y la documentación. Esta revisión amplía únicamente el README a partir del repositorio, las evidencias y las comprobaciones indicadas; conserva el código, el diseño y los archivos locales existentes.

Las pruebas automáticas y los experimentos guardados no sustituyen una comprobación visual manual. No se atribuyen a integrantes acciones, nombres o verificaciones que no estén confirmados. Los dos commits iniciales aparecen atribuidos por Git a `javistravis7`, pero eso no permite establecer la autoría de cada línea ni las herramientas usadas antes. La identidad de un commit local tampoco certifica una revisión manual de su titular.
