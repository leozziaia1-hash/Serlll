# Optimización Técnica y Corrección de Físicas en Circuito 2 (Speedway GP)

Plan de ingeniería avanzada para corregir los cuellos de botella de física, colisiones del pit wall, detección matemática de línea de meta a alta velocidad, sincronización de la IA y mitigación de Z-fighting en el Circuito 2, respetando las preferencias de carrera clásica sin DRS y atmósfera actual.

## Decisiones Críticas del Usuario

> [!IMPORTANT]
> Decisiones confirmadas por el usuario en la fase de análisis:
> - **Modo de Competición**: Mantener el Circuito 2 sin DRS como carrera tradicional de alta velocidad.
> - **Barreras y Colisiones**: Mantener las barreras visuales actuales, ajustando y saneando únicamente los colisionadores de física (separación del pit wall de la pista y corrección de segmentos de colisión invisibles).
> - **Atmósfera y Gráficos**: Conservar la atmósfera con niebla actual del circuito, solucionando el Z-fighting visual en la pista sin alterar el esquema de iluminación y niebla.

---

## 1. Visión General del Sistema y Objetivos

El Circuito 2 (*Speedway GP*) es un autódromo de 2.780 metros de longitud con una recta principal de alta velocidad y velocidades punta de 358 km/h. La intervención técnica tiene como objetivo eliminar frustraciones de jugabilidad sin romper la estética original:

1. **Evitar colisiones fantasma en la recta**: Separar el colisionador estático del muro de boxes del asfalto activo (actualmente posicionado exactamente en el límite exterior `z = -122.0`).
2. **Garantizar el cómputo de vueltas al 100%**: Sustituir la comprobación por caja rectangular (`x >= -20 && x <= 20`) por una detección analítica de corte de plano (cruce de segmento `X = 0` con velocidad positiva) para que ningún salto de frametime a 358 km/h omita una vuelta completada.
3. **Corregir la navegación de la IA en boxes**: Reemplazar la condición `currentSector === 4` (inexistente en el Circuito 2) por la detección del sector final de aproximación a la recta.
4. **Erradicar el Z-Fighting en la recta de 1,1 km**: Reajustar offsets de profundidad y elevaciones relativas (`polygonOffset` y cotas micrométricas estables) en las líneas blancas, astroturf y asfalto.
5. **Limpieza en el HUD**: Desactivar elegantemente el indicador de DRS en el HUD cuando el circuito activo sea tradicional (sin DRS), evitando que parezca una función bloqueada o con error.

---

## 2. Arquitectura de Corrección y Componentes

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RACING ENGINE PIPELINE                          │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       ▼                           ▼                           ▼
┌──────────────┐          ┌─────────────────┐         ┌─────────────────┐
│ Speedway     │          │ Collision       │         │ AICarController │
│ TrackBuilder │          │ Subsystem       │         │ & Sector Logic  │
└──────┬───────┘          └────────┬────────┘         └────────┬────────┘
       │                           │                           │
       │• Ajuste Z del pit wall    │• Filtro de colisión       │• Corrección de  │
       │  (z: -121.2m vs -122.0m)  │  pistas vs escapatorias   │  sector final   │
       │• Separación de cotas      │• Eliminación de paredes   │  (S3 vs S4)     │
       │  antiparapadeo (Z-fight)  │  fantasma diagonales      │• Cruce analítico│
       │• Offset de líneas 0.030m  │                           │  de meta X=0    │
       └───────────────────────────┴───────────────────────────┘
```

---

## 3. Plan Paso a Paso de Implementación

### Fase 1: Corrección de Colisionadores y Pit Wall (`SpeedwayTrackBuilder.ts`)
- **Separación del Pit Wall**:
  - Modificar el registro en `staticObstacles` del muro de garajes de `z: -122.0` a `z: -121.1`, dejando un margen de seguridad de 0.9 m respecto a la línea blanca de la pista (`halfWidth = 8.0 m`, pista en `z: -130.0`).
- **Saneamiento de Barreras en Curvas**:
  - Ajustar el filtrado de segmentos en `buildSafetyBarriersAndCatchFences` para que los colisionadores de pared solo se registren en tramos contiguos comprobados, evitando generar colisionadores que atraviesen zonas de escape.

### Fase 2: Detección Analítica de Cruce de Meta (`SpeedwayCircuitConfig.ts`)
- **Algoritmo de Cruce de Línea**:
  - Sustituir la comprobación `x >= -20 && x <= 20` por una comprobación de dirección y umbral:
    Si el coche se encuentra en el sector 3, con `z < -115`, y su coordenada X cruza la línea de meta `x = 0` (o `x >= -2.0 && x <= 35.0` con verificación de signo de desplazamiento), se marca inmediatamente `newSector: 0, lapCompleted: true`.
  - Registrar el tiempo de vuelta con total precisión independientemente de la tasa de refresco.

### Fase 3: Corrección de la Inteligencia Artificial (`AICarController.ts`)
- **Sector de Preparación de Parada**:
  - Actualizar la lógica de parada en boxes para verificar el sector final del circuito activo:
    En lugar de `this.currentSector === 4`, utilizar `this.currentSector === (totalSectors - 1)` o comprobar `this.currentSector === 3` cuando el circuito activo sea `speedway_gp`.
  - Suavizar el vector de aproximación al carril de boxes para evitar movimientos bruscos de la IA en la recta.

### Fase 4: Mitigación de Z-Fighting y Parpadeo de Profundidad
- **Ajuste de Alturas y Materiales**:
  - Elevar la cota Y de las líneas de delimitación de pista (`leftLineVertices`, `rightLineVertices`) a `0.032` y activar `polygonOffset: true, polygonOffsetFactor: -1.0, polygonOffsetUnits: -1.0` en `whiteLineMat` y `yellowLineMat`.
  - Asegurar que el asfalto base permanezca en `y = 0.020` y el astroturf en `y = 0.026`, eliminando cualquier solapamiento coplanar.

### Fase 5: Refinamiento del HUD para Circuitos Tradicionales (`HUD.tsx`)
- **Estado Limpio del DRS**:
  - Si el circuito actual no posee zonas DRS (`drsZonesCount === 0`), el botón e indicador de DRS en el HUD se ocultarán o se presentarán en estado inactivo armonizado, indicando "MODO CLÁSICO" o permaneciendo transparentes para no inducir a confusión al jugador.

---

## 4. Verificación y Pruebas

- **Test de Recta a Máxima Velocidad**: Conducir a 355+ km/h por el carril derecho de la recta principal rozando la línea blanca para certificar cero colisiones con el muro de boxes.
- **Test de Conteo de Vuelta**: Completar 2 vueltas consecutivas en el Circuito 2 a diferentes velocidades y trazadas para validar el 100% de efectividad en el paso por meta.
- **Test de Comportamiento IA**: Observar a los rivales IA a lo largo de los sectores 1, 2 y 3, verificando que no desaceleren abruptamente en la chicana y que entren a boxes con suavidad.
- **Test de Estabilidad de Renderizado**: Verificar en la cámara de persecución lejana la ausencia de parpadeo (Z-fighting) entre las líneas blancas y el asfalto.
- **Compilación**: Ejecutar `compile_applet` y `lint_applet` para confirmar cero advertencias o errores de TypeScript.
