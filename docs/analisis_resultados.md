# Análisis de resultados reales

Este análisis corresponde a las 15 ejecuciones nuevas de [`summary.json`](../results/evidence_20261025_032443_774927_fa6eaea1/summary.json), realizadas el 24 de octubre de 2026 en Cancún (25 de octubre en sus marcas UTC). No reutiliza los números de la auditoría como evidencia de estas correcciones.

## Escenario base y evolución

Se usaron ocho satélites, población 70, 120 generaciones, radio 300 km y mutación 0.22. Todas las semillas produjeron configuraciones finales válidas, sin infracciones, con 6/6 regiones y aptitud 100.

| Semilla | Aptitud inicial | Aptitud final | Primera generación con 6/6 |
|---|---:|---:|---:|
| 42 | 92.3077 | 100 | 1 |
| 43 | 100 | 100 | 0 |
| 44 | 100 | 100 | 0 |
| 45 | 100 | 100 | 0 |
| 46 | 100 | 100 | 0 |

Las cinco configuraciones finales tienen coordenadas distintas. Repetir la semilla 42 reprodujo exactamente posiciones iniciales/finales, métricas, historia, parámetros y escenario. Las duraciones base estuvieron entre 1.060 y 1.102 s en este equipo; dependen del entorno y no son una garantía.

La media final es 100 y la desviación poblacional es 0 para estas cinco muestras. Esa igualdad de puntuación no significa igualdad de posiciones ni estabilidad garantizada para cualquier escenario. Es una muestra pequeña y el escenario es fácil con el muestreo dirigido.

La configuración inicial es la mejor de 70 individuos. Cuatro semillas ya tenían una solución completa en la generación cero. Sus curvas planas desde 100 no prueban que el algoritmo no genere alternativas; muestran que la métrica ya alcanzó su techo antes de reproducirse. El elitismo conserva ese resultado y no cambia de mejor histórico ante empates. En la semilla 42 se observa mejora real de 92.3077 a 100.

## Efecto de las restricciones

Las cinco exclusiones originales se verifican individualmente en las pruebas: sus centros se rechazan y el generador devuelve posiciones válidas incluso al dirigir sus intentos a esos centros. Las soluciones completas originales cumplen las exclusiones, pero por sí solas no miden cuánto dificultan la búsqueda: las zonas originales no bloquean los centros regionales.

Al añadir una exclusión de 6° sobre Yucatán, las cinco semillas 42–46 terminan válidas con 5/6 regiones, aptitud 76.9231 y cobertura ponderada 76.92%. Falla Yucatán: su peso 3 representa 3/13 del total. Media final 76.9231 y desviación poblacional 0 en estas cinco muestras. Las duraciones estuvieron entre 1.138 y 1.216 s.

En este escenario particular hay una explicación geométrica: todo punto a ≤300 km del centro de Yucatán se encuentra a ≤2.70°, dentro de la exclusión de 6°. Por tanto, no existe una posición admitida que cubra ese centro. El programa informa cobertura parcial y no objetivo cumplido. Esta conclusión se deriva de la geometría de este escenario, no de observar una curva sin mejora.

## Cambios de prioridades

En el escenario reducido se bajó Yucatán de peso 3 a 1 y se subió Australia de 1 a 3, manteniendo suma total 13. El experimento con semilla 42 dio 5/6 regiones, aptitud 92.3077 y cobertura ponderada 92.31%.

Se comprobó además la misma configuración reducida con los nuevos pesos: también da 92.31%. La ejecución con prioridades cambiadas produjo **las mismas posiciones** que la ejecución reducida de semilla 42. Por ello, este experimento demuestra un cambio de valoración de la pérdida de Yucatán, no una redistribución espacial causada por prioridades. No hay evidencia aquí para afirmar que la búsqueda cambió sus decisiones de colocación. Para estudiar esa pregunta haría falta un escenario con competencia entre objetivos alcanzables.

## Mutación y variación

Con semilla 42 y el escenario base, mutación 0.05 alcanzó 6/6 por primera vez en la generación 1; mutación 0.40 lo hizo en la generación 3. Ambas terminaron válidas con aptitud 100; la inicial fue 92.3077. Duraciones aproximadas: 0.927 y 1.141 s.

Este par aislado no demuestra que una tasa sea mejor en general. La comparación comparte semilla y población inicial, pero necesitaría más semillas y escenarios difíciles para sostener conclusiones sobre convergencia o robustez.

## Fallo de generación en un escenario admitido

Se configuraron dos exclusiones de 100° centradas en puntos antipodales (0°,0°) y (0°,180°), con semilla 42, población 4 y dos generaciones. Todos los valores están dentro del dominio admitido de radios (0,180]. La ejecución terminó en aproximadamente 0.002 s con estado `generation_failed`, escenario y parámetros guardados, sin una configuración inventada ni reintentos ilimitados.

Geométricamente esas dos zonas cubren toda la esfera: si un punto queda a ≥100° de un centro, queda a ≤80° del opuesto. El algoritmo no incorpora un demostrador general de inviabilidad; solo informa que agotó 500 intentos y los centros regionales. En otros escenarios podría fallar por no muestrear una zona válida muy pequeña. Una exclusión de 181° se usa únicamente como prueba de **rechazo de entrada**, no como evidencia espacial admitida.

## Límites y alcance

- La cobertura es binaria sobre centros regionales. No se calcula porcentaje de superficie, acceso temporal ni mecánica orbital.
- El muestreo dirigido y la elección uniforme de regiones favorecen encontrar cobertura pronto; el muestreo global no es uniforme en área.
- No se evita que satélites nuevos coincidan entre sí; solo se exige identidad única y cumplimiento de las cinco exclusiones y las adicionales del experimento.
- La aptitud informa rendimiento de este modelo. Estancarse no prueba un óptimo global; cubrir todos los centros válidamente alcanza el techo conocido de esta métrica, sin implicaciones para un sistema físico.
- Los resultados son reproducibles con el código y parámetros de esta ronda. La ampliación del dominio de latitud cambió la secuencia respecto de la versión auditada; no deben compararse semillas de versiones distintas como si fueran ejecuciones idénticas.
- Las pruebas de comportamiento de interfaz aprobaron. La comprobación visual real quedó pendiente porque Chrome y Edge no respondieron al canal de control y la ejecución fuera del sandbox no fue autorizada. No se afirma que arrastre, zoom o descarga real hayan sido probados visualmente.

## Revalidación de una configuración anterior — Classroom 3.3

Para responder si una configuración anterior sigue siendo válida cuando cambian las condiciones, esta revisión documental tomó `best` del [JSON base de semilla 42](../results/evidence_20261025_032443_774927_fa6eaea1/astroshield_20261025_032445_043774_9e6a03920be9490e928d460540353e90.json) y lo evaluó con el código actual, sin mover satélites ni volver a ejecutar la búsqueda. Se usó `evaluate_constellation` con copias de `scenario`; en la segunda evaluación se cambió Yucatán a Normal/1 y Australia a Alta/3, y en la tercera se conservaron las prioridades originales y se añadió la exclusión `stress_yucatan` de 6° en (20.5°,−89°). No se modificó el archivo fuente ni se generó otro JSON de resultados.

| Condiciones aplicadas a las mismas posiciones | Cobertura ponderada | Aptitud | Validez y estado |
|---|---:|---:|---|
| Escenario original | 100% | 100 | Válida, `complete` |
| Solo cambio de prioridades | 100% | 100 | Válida, `complete` |
| Nueva exclusión de Yucatán, pesos originales | 100% | 80 | Inválida, `invalid`: `SAT-03` invade la nueva exclusión |

Cambiar prioridades no altera las restricciones y, al estar todas las regiones cubiertas, tampoco cambia esta puntuación normalizada. Añadir la zona sí invalida las posiciones anteriores. El evaluador sigue contando cobertura por cercanía incluso para un satélite infractor; el estado inválido impide aceptar esa cobertura como solución. Este resultado confirma por qué puntuación y validez se informan por separado.

La nueva búsqueda reducida ya guardada encuentra posiciones distintas y admitidas, pero pierde Yucatán: 76.92% y aptitud 76.9231. Tiene menos puntuación que las posiciones anteriores infractoras (80), y aun así es la alternativa admisible. No corresponde declarar mejor una solución prohibida solo porque puntúe más.

Para repetir la tercera fila sin escribir archivos, abre el intérprete desde la raíz con `.\.venv\Scripts\python.exe -B` en PowerShell o `./.venv/Scripts/python.exe -B` en Git Bash y pega estas instrucciones Python:

```python
import json
from copy import deepcopy
from pathlib import Path
from src.core.fitness import evaluate_constellation

carpeta = Path("results/evidence_20261025_032443_774927_fa6eaea1")
resumen = json.loads((carpeta / "summary.json").read_text(encoding="utf-8"))
caso = next(c for c in resumen["cases"] if c["label"] == "base_seed_42")
resultado = json.loads((carpeta / caso["file"]).read_text(encoding="utf-8"))
escenario = deepcopy(resultado["scenario"])
escenario["restricted_zones"].append(dict(id="stress_yucatan", name="Zona experimental sobre Yucatan", lat=20.5, lon=-89.0, radius_deg=6.0))
metricas = evaluate_constellation(resultado["best"], **escenario)
print(metricas["status"], metricas["fitness"], metricas["weighted_coverage_pct"])
print(metricas["validation"])
```

Debe imprimir `invalid 80.0 100.0` y la infracción de `SAT-03`. Las dos primeras filas usan el mismo evaluador sin añadir la zona y, en su caso, cambiando los dos pesos indicados. Usa `quit()` para salir del intérprete.

## Qué evidencia permite comparar soluciones — entregable 4

Primero se exige validez; después se compara cobertura ponderada bajo el **mismo escenario y los mismos pesos**. La población inicial y final de semilla 42 cumplen ambas la validez y usan el mismo criterio: la final añade Australia y mejora de 92.3077 a 100. Esa comparación sí demuestra una mejora dentro del modelo, respaldada por los campos de regiones y la historia del JSON.

Las cinco semillas base terminan empatadas en aptitud y validez: las coordenadas distintas no prueban que una sea superior, pues la función no mide redundancia ni otros criterios orbitales. Tampoco se deben ordenar directamente 76.92% y 92.31% de los experimentos reducidos como si hubiera mejorado la colocación: cambiaron los pesos y las posiciones fueron iguales. La comparación de mutación con una sola semilla sigue siendo exploratoria.

La justificación de **por qué** se eligieron representación, pesos y operadores pertenece a la [definición del problema](definicion_problema.md#justificación-técnica-del-modelo-actual--entregable-1). Las conclusiones de este documento se limitan a **qué muestran** las ejecuciones y revalidaciones citadas. No hay referencias externas ni verificación visual adicional que sustenten afirmaciones más amplias.
