# Seguridad

## Qué NUNCA debe estar en este repositorio

Llaves de API (JEV, OpenAI, etc.), tokens de Telegram o de n8n, el ID de tu hoja o de tus
credenciales, tu chat de Telegram, correos o datos de clientes reales. Los datos de `examples/`
son ficticios.

## Si subiste algo por error

1. **Rota la llave de inmediato**: crea una nueva y borra la vieja en el servicio. Borrar el commit no basta, puede haberse copiado.
2. Después limpia el historial.

## Cómo se protege el sistema en uso

- Las credenciales viven en el sistema de credenciales de n8n, nunca dentro de un nodo.
- La IA solo elige de un menú cerrado; la **cantidad a comprar** y los límites los calcula el código.
- Las órdenes que crea son **borradores**: una persona las revisa antes de enviarlas al proveedor.
- Si la IA no responde, no se compra nada: el producto pasa a revisión humana.

## Reportar una vulnerabilidad

Usa *Security → Report a vulnerability* de GitHub (reporte privado). No abras un issue público con detalles de la falla.
Es un proyecto personal: no hay plazos garantizados de respuesta.
