# Glosario

| Palabra | Qué significa |
|---|---|
| **n8n** | Programa que conecta aplicaciones entre sí mediante "flujos" que se arman con cajitas (nodos). Aquí es el que calcula, llama a JEV y ejecuta. |
| **Flujo (workflow)** | Un conjunto de nodos conectados que hacen una tarea. |
| **Nodo** | Una cajita del flujo: hace una cosa (leer la hoja, calcular, mandar un mensaje). |
| **Credencial** | La llave de una cuenta (Google, Telegram, JEV). Se guarda en n8n, no en el flujo. |
| **JEV** | El modelo que decide qué hacer con cada producto. Es un servicio de terceros que se paga con créditos. |
| **Crédito** | La unidad que cobra JEV. Cada producto analizado gasta unos 1.400. |
| **SKU** | El código único de un producto, por ejemplo `CAR-GAN-65`. |
| **Candado** | Una regla del código que el modelo no puede saltarse (por ejemplo: no comprar con menos de 60% de confianza). |
| **Bitácora** | La pestaña `decisiones`: un registro de qué datos recibió JEV, qué decidió y qué hizo n8n. |
| **Borrador de orden** | Una fila en `ordenes_compra` con estado `borrador`. No compra nada: una persona la revisa. |
| **Chat id** | El número de tu conversación de Telegram; indica a quién llegan los avisos. |
| **ID de la hoja** | La parte larga de la dirección de tu hoja de Google, entre `/d/` y `/edit`. |
| **Importar** | Cargar un archivo `.json` dentro de n8n para crear un flujo. |
