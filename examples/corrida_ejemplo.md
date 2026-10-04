# Corrida de ejemplo (datos ficticios)

Tienda ficticia de accesorios para celular, 11 productos analizados el mismo día. Las decisiones son las
reales que devolvió el modelo `jev-1.13.0` en una corrida de prueba de la autora; no son un guion.

| Producto | Decisión | Nota |
|---|---|---|
| Protector de vidrio Galaxy S24 | PRIORITIZE, urgencia crítica | 26 clientes esperando, 20 en stock |
| Cargador GaN 65W | PRIORITIZE | Demanda al alza, proveedor de 21 días |
| Micrófono de solapa USB-C | ALERT (83%) | Una semana sin vender con 64 en stock |
| Funda iPhone 15 | WAIT | Poco stock, pero la demanda cayó |
| Audífonos gamer | HUMAN_REVIEW | Un pico dudoso de ventas: no se compra sobre un dato sospechoso |
| Funda con stock negativo | Frenada, no se consultó al modelo | Dato imposible |

Lo interesante: dos productos llevaban días sin vender. El soporte para auto estaba **agotado**: no vendía
porque no había qué vender, y recibió urgencia casi máxima. El micrófono **tenía stock**: recibió una alerta.
Una regla fija los trata igual.

Para reproducir el mismo estado sin n8n, importa `examples/playground/jev-playground-prot-s24-vid.json`
en el Playground de JEV.

> Esta tabla resume 6 de los 11 productos analizados; el resto se ve en la hoja de ejemplo tras correr el flujo.
