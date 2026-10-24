# Definición del problema — AstroShield

## Representación
Una configuración es una lista de ocho satélites. Cada satélite contiene un identificador y una posición geográfica (`lat`, `lon`) sobre una esfera terrestre. Es un modelo educativo de posiciones de observación, no una predicción de órbitas reales.

## Cobertura
Una región se considera cubierta si al menos un satélite está a una distancia de círculo máximo menor o igual a 300 km de su centro. La distancia se calcula con la fórmula del haversine/equivalente angular sobre una esfera de radio 6371 km.

## Prioridades y aptitud
Las prioridades se traducen en pesos: Alta = 3, Media = 2, Normal = 1. La cobertura ponderada es la suma de pesos cubiertos dividida entre la suma de todos los pesos, expresada como porcentaje. La aptitud resta 20 puntos por cada satélite que infrinja una zona de exclusión. Independientemente de la aptitud, una configuración con infracciones se marca como inválida y no puede defenderse como solución aceptable.

## Restricciones
Se prohíbe ubicar satélites dentro de los radios angulares de las tres zonas de desechos y los dos objetos ocupados. Los radios están en grados centrales sobre la esfera. Los puntos exactamente sobre el límite se aceptan; los puntos estrictamente dentro se rechazan.

## Algoritmo evolutivo
La población inicial contiene configuraciones generadas al azar, con mayor probabilidad de muestrear alrededor de las regiones objetivo para que la cobertura de 300 km sea alcanzable. Se utiliza selección por torneo, cruce de un punto, mutación de posiciones, elitismo de dos individuos y una población de tamaño configurable. Las posiciones nuevas se generan válidas con respecto a las restricciones actuales.

## Parámetros iniciales
- Satélites: 8.
- Población: 70.
- Generaciones: 120.
- Tasa de mutación por satélite: 0.22.
- Radio de cobertura: 300 km.
- Semilla aleatoria: opcional para repetir una ejecución.

## Condición de solución suficiente
La condición preferida es cubrir las seis regiones, tener cero infracciones y conservar una configuración válida. Si no se logra, se reporta la cobertura alcanzada y las limitaciones; no se afirma que sea óptima globalmente.

## Limitaciones
La posición de cada satélite representa un punto geográfico de observación simplificado. No se modelan altitud, inclinación orbital, periodos, campo de visión real, interferencia, consumo ni dinámica temporal. La función objetivo y los parámetros influyen en el resultado; varias ejecuciones con distintas semillas son necesarias para valorar estabilidad.
