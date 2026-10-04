# Cómo funciona

## La regla de reparto

- **El código pone los hechos y los límites:** cálculos, cantidad a comprar, candados. Eso se calcula, no se opina.
- **El modelo pone el criterio:** qué conviene hacer con este producto en este contexto.

Prueba para decidir quién decide qué: si esto sale mal 1 de cada 20 veces, ¿cuánto cuesta? Si cuesta dinero, lo decide el código.

## Las tres etapas

1. **Calcula** (`calcularProductos` en `src/logica_inventario.js`): con 28 días de ventas obtiene velocidad, tendencia, días de cobertura y picos, y trae lo del proveedor y las órdenes abiertas.
2. **Decide**: por producto se envía un estado con esos números y 5 preguntas con respuestas cerradas:
   1. ¿Qué hacer? (reabastecer, priorizar, esperar, alerta, revisión humana)
   2. ¿Qué tan urgente? (nada, baja, alta, crítica)
   3. ¿Se queda sin stock antes de que llegue un pedido hecho hoy? (sí/no)
   4. ¿La demanda sube de verdad, o es un pico, un error o efecto de estar agotado? (sí/no)
   5. ¿Comprar ahora dejaría mercancía de más? (sí/no)
3. **Valida y ejecuta** (`interpretarDecision`, `armarMensajes`): aplica los candados, calcula la cantidad, crea el borrador, anota la bitácora y avisa.

El modelo no escribe texto libre ni inventa acciones: solo elige y da probabilidades.

## Los cuatro flujos

| Flujo | Para qué |
|---|---|
| `inventario_crea_hoja` | Crea la hoja con datos ficticios (una vez) |
| `inventario_jev_decide` | El flujo principal |
| `inventario_reinicia_demo` | Vuelve la demo a cero |
| `inventario_errores` | Avisa a Telegram si un flujo falla. Usa solo la credencial de Telegram, así sigue avisando aunque la llave de JEV o la de Google estén rotas |

## Robustez en tres capas

1. **Reintentos** en los nodos que llaman a servicios externos.
2. **Respaldo:** si el modelo falla (llave inválida, sin créditos, tiempo agotado), el producto pasa a revisión humana y se avisa con un mensaje claro. Probado provocando una llave inválida.
3. **Aviso global de errores** a Telegram.

## Modificarlo

- Cambiar el umbral de 60% de confianza: `src/logica_inventario.js`, constante `CONFIANZA_MINIMA`.
- Cambiar las preguntas: función `preguntasJev`.
- Usar otro modelo: hoy es un único nodo HTTP; ver el [ROADMAP](../ROADMAP.md).
- Después de cambiar la lógica, corre `npm test` y copia las funciones a los nodos Code del flujo.

## Probar la decisión sin n8n

En `examples/playground/` hay dos configuraciones JSON que se pueden importar en el Playground de JEV para ver la misma decisión sin n8n.
