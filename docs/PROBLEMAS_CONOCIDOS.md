# Problemas conocidos (los vivimos todos)

| Síntoma | Causa | Qué hacer |
|---|---|---|
| Errores 402 de créditos insuficientes con saldo suficiente | Se mandaron varias consultas casi a la vez | El flujo envía de a una, con 4,5 s entre arranques. No lo aceleres |
| Google Sheets deja de funcionar a la semana | El permiso OAuth de una app en modo *Testing* caduca a los ~7 días | Reconecta la credencial, o usa una cuenta de servicio |
| Aviso de ventas desactualizadas | Las ventas tienen más de 14 días | Actualiza las ventas o corre `inventario_reinicia_demo` |
| No llega el aviso de error al ejecutar a mano | El flujo de errores solo se dispara en ejecuciones de producción y debe estar publicado y elegido en los ajustes | Publícalo y elígelo como *Error Workflow* |
| Aviso de que no se pudo consultar a JEV | Llave inválida, sin créditos o tiempo agotado | Revisa la credencial `jev_api` y tu saldo |
