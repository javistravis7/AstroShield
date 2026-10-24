# Plan de pruebas y evidencias

Registrar por ejecución: fecha, semilla, generaciones, población, mutación, aptitud, porcentaje de cobertura ponderada, regiones cubiertas, validez, duración y archivo JSON producido.

1. **Escenario inicial:** ejecutar con parámetros predeterminados y revisar las seis regiones.
2. **Evolución:** guardar y comparar `history` a lo largo de las generaciones.
3. **Zonas restringidas:** comprobar que ninguna posición final cae dentro de Atlántico Norte, Pacífico Sur o región polar norte.
4. **Objetos ocupados:** comprobar las exclusiones de Objeto A y Objeto B.
5. **Espacio reducido:** agregar una zona de exclusión adicional mediante una prueba unitaria o una configuración experimental y comparar la cobertura.
6. **Condición difícil/inviable:** aumentar radios o añadir restricciones hasta impedir posiciones válidas; registrar el error o la cobertura incompleta sin ocultarlo.
7. **Variación:** ejecutar al menos cinco semillas diferentes con los mismos parámetros.
8. **Prueba adicional:** comparar mutación 0.05 frente a 0.40 y describir su efecto sobre la convergencia y la variación.

No inventar resultados. Completar esta documentación con los resultados reales generados por el programa.
