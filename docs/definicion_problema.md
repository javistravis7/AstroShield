# Definición del problema — AstroShield

## Modelo y cobertura

Cada individuo contiene exactamente ocho objetos `{id, lat, lon}`. Representan puntos geográficos de observación sobre una esfera de radio 6371 km, no trayectorias orbitales. No se modelan altitud, velocidad, periodos, combustible, interferencia ni separación entre satélites nuevos. Dos satélites pueden compartir coordenadas, pero no identificador.

Se usa distancia de círculo máximo: `R × acos(sin φ1 sin φ2 + cos φ1 cos φ2 cos Δλ)`. Se limita el argumento de acos a [-1,1] por redondeo. Una región está cubierta si algún satélite está a una distancia ≤300 km de su **centro**. Esto no demuestra cobertura de toda una superficie de 300 km de radio, ni cobertura continua a lo largo del tiempo.

Las coordenadas y prioridades originales están en `src/data/scenario.py`: Yucatán (20.5,-89), Amazonía (-3.5,-62), California (36.8,-119.4), Sahel (15,0), Japón (36,138) y Australia (-25,133). Alta=3, Media=2, Normal=1. Los experimentos pueden cambiar pesos; el número `weight` es el valor efectivo y `priority` es su etiqueta descriptiva. Los controles existentes cambian ambos conjuntamente.

`cobertura_ponderada = suma de pesos de regiones cubiertas / suma de todos los pesos`.

`aptitud = 100 × cobertura_ponderada − 20 × número de satélites con infracciones`.

Una región se cuenta una vez aunque la cubran varios satélites. Un satélite que invade varias exclusiones recibe una penalización de 20, y se detallan todas sus infracciones. La validez es obligatoria y separada de la puntuación: una aptitud alta nunca convierte una configuración inválida en aceptable. Las estructuras mal formadas se rechazan antes de evaluar cobertura.

Las infracciones nuevas incluyen nombres e IDs de las exclusiones; la interfaz usa IDs para distinguirlas incluso si repiten nombre. Para resultados anteriores sin IDs conserva la identificación por nombre.

## Restricciones

Se rechazan puntos cuya distancia angular al centro sea **estrictamente menor** que el radio. El límite se admite, sujeto al redondeo de coma flotante. Se aplican las tres zonas originales (Atlántico Norte 12°, Pacífico Sur 10°, polar norte 8°) y las exclusiones de Objeto A y B (5° cada una). Son restricciones de posición, no de intersección del área de cobertura con una zona.

## Dominio admitido

Estos límites se comparten entre el núcleo y la API; no se convierten silenciosamente cadenas en números ni decimales en enteros.

| Entrada | Dominio |
|---|---|
| Constelación | Lista de exactamente 8 objetos; IDs únicos |
| `lat`, `lon` | Números finitos en [-90,90] y [-180,180] |
| `id`, `name` | Cadenas no vacías, no solo espacios, de hasta 100 caracteres |
| Regiones | Lista de 1 a 64; `id`, `name`, `lat`, `lon`, `priority`, `weight` obligatorios |
| Prioridad | `Alta`, `Media` o `Normal` |
| Peso | Número finito, 0 < peso ≤1000 |
| Zonas / objetos | Cada lista admite 0 a 64; requiere `id`, `name`, `lat`, `lon`, `radius_deg` |
| Radio angular | Número finito, 0 < radio ≤180° |
| Identificadores del escenario | Únicos entre regiones, zonas y objetos |
| Generaciones | Entero entre 1 y 1000 |
| Población | Entero entre 4 y 300 |
| Mutación por satélite | Número finito entre 0 y 1 |
| Semilla | Entero entre 0 y 4294967295, o `null` para generar y registrar una semilla |
| JSON de la API | Objeto de hasta 256 KiB; sin campos superiores desconocidos |

Los booleanos no cuentan como números. Omitir las listas del escenario usa los valores originales; enviar `null` en una lista es un error. Las exclusiones pueden ser listas vacías, las regiones no. La API conserva los ocho satélites y el radio de observación de 300 km; no acepta campos para cambiarlos. El evaluador Python permite estudiar otros radios de observación en (0, π×6371] km.

## Algoritmo y decisiones

Parámetros iniciales: población 70, generaciones 120, mutación 0.22, ocho satélites y semilla opcional. El 82% de los intentos elige una región al azar y perturba latitud/longitud mediante gaussianas de desviación 2°. Se limita la latitud a [-90,90] y se envuelve la longitud a [-180,180). El 18% restante explora latitud uniforme [-90,90] y longitud uniforme [-180,180]. Este muestreo no es uniforme en área de la esfera y depende de la latitud.

El muestreo dirigido facilita descubrir objetivos pequeños de 300 km (aproximadamente 2.70°). La desviación 2° combina proximidad y variación, y la fracción global conserva exploración fuera de las regiones. Son elecciones educativas prácticas, no parámetros demostrados óptimos. En esta corrección se amplió la latitud global anterior [-85,85] a todo el dominio admitido y se retiró el recorte dirigido a ±89.5°. Por eso una misma semilla no tiene por qué repetir resultados de la versión anterior.

Cada posición tiene como máximo 500 intentos. Después se prueban los centros regionales válidos en orden. Si no se encuentra un punto, se lanza `GenerationFailure`: agotar el muestreo **no prueba inviabilidad matemática**, aunque el escenario particular pueda ser inviable. El fallo cancela la ejecución y no presenta una solución parcial como exitosa. No hay reintentos ilimitados.

La selección usa torneos de tres entre la mitad superior de la población (al menos cuatro candidatos). Se cruza en un punto entre los ocho genes. La mutación reemplaza posiciones con el mismo generador validado. Se conservan los dos mejores individuos; los empates no sustituyen al mejor histórico. El cruce preserva validez porque mezcla posiciones válidas bajo el mismo escenario. Se cachean puntuaciones por coordenadas dentro de cada generación para evitar evaluaciones repetidas; no se modifica el criterio de evaluación.

La configuración inicial es **la mejor de la población inicial**, no una constelación aleatoria aislada. La generación cero registra esa población antes de reproducirse. Con 120 generaciones hay 121 puntos. Se ejecuta el presupuesto completo aunque se alcance cobertura total; una curva plana desde 100 significa que ya había una configuración completa al comenzar.

## Estados y contratos

| Estado | Significado |
|---|---|
| `complete` | Ocho satélites válidos y todas las regiones cubiertas |
| `partial` | Configuración válida, pero faltan regiones |
| `invalid` | Configuración con infracciones espaciales; nunca objetivo cumplido |
| `generation_failed` | No se logró generar una posición dentro del presupuesto de muestreo |

La API devuelve 200 para una ejecución con resultado (que puede ser parcial), 400 para datos incorrectos, 409 si otra petición está optimizando y 422 para fallo de generación. La aplicación educativa corre en un proceso; el bloqueo del servidor es por proceso, no un coordinador entre múltiples servidores.

Cada resultado nuevo (`schema_version: 2`) incluye semilla realmente usada, parámetros de muestreo, copia del escenario, posiciones iniciales y finales, ambas métricas y curva completa. Los fallos también incluyen escenario y parámetros. Las vistas usan el escenario del resultado, no el formulario mutable. Se bloquean los parámetros y cambios de escenario durante una ejecución y durante las cinco semillas de una comparación.

Los JSON anteriores se conservan. No tienen `initial_metrics` ni algunos metadatos nuevos: la visualización permite la vista final cuando existe escenario e informa que no dispone de comparación inicial. Sin escenario no se puede visualizar de forma fiable. No se añadió un importador de archivos a la interfaz. Semillas antiguas `null` no permiten reconstruir exactamente su azar.

La condición suficiente de la actividad es `complete`. No mejorar durante varias generaciones no demuestra un óptimo global. El modelo tiene un techo de puntuación conocido (100 con cero infracciones), pero no permite conclusiones sobre un sistema orbital físico.
