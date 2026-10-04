# Uso

> ⚠️ BORRADOR: describe el sistema tal como existe hoy; los nombres exactos de nodos pueden cambiar al exportar los flujos.

## Correr un análisis

El flujo principal se ejecuta desde un formulario de n8n: eliges **un producto** o **todo el inventario**.
Empieza siempre con uno, para ver que todo conecta y gastar pocos créditos.

## Qué recibes

- **Telegram:** un resumen (cuántos decididos, cuántos sin respuesta, cuántos frenados) y un aviso por cada producto con alerta o revisión humana, con el porqué de la decisión.
- **Hoja, pestaña `decisiones`:** una fila por producto con lo que se envió, lo que decidió el modelo, sus probabilidades y lo que hizo n8n. La columna `decidido_por` dice quién tuvo la última palabra:
  - `jev`: el modelo;
  - `candado`: n8n frenó una compra (poca confianza u orden abierta);
  - `candado_datos`: dato imposible, no se consultó;
  - `fallback`: el modelo no respondió.
- **Hoja, pestaña `ordenes_compra`:** borradores. **Una persona los revisa antes de enviarlos.** El sistema no compra nada por sí solo.

## Usar tus propios datos

Sustituye las filas de `productos`, `proveedores` y `ventas` por las de tu negocio, con las mismas columnas que `examples/datos_demo/`. Reglas:

- La columna `historia_demo` es solo para quien lee: no se envía al modelo. Puedes dejarla vacía.
- `ventas` lleva una fila por día y producto con unidades vendidas.
- Si las ventas tienen más de 14 días sin actualizar, el sistema se detiene con el aviso "ventas desactualizadas". Es un candado a propósito.

## Dejarlo corriendo solo (opcional)

Los flujos no traen horario. Si agregas un nodo Schedule, cada disparo será una ejecución **real** que gasta créditos. Hazlo solo cuando hayas probado a mano, y revisa tu saldo.

## Volver a empezar la demo

Importa `workflows/inventario_reinicia_demo.json`, pon el ID de tu hoja en su nodo `config`, elige tu credencial de Google y córrelo: borra decisiones y órdenes y vuelve a poner los datos ficticios con fechas de hoy. No gasta créditos.
