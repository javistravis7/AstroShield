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
