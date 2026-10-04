# Instalación (de cero a la primera corrida)

> ⚠️ **BORRADOR.** Los flujos JSON ya existen, pero esta guía todavía no se ha probado completa importándolos en un n8n limpio.

Tiempo estimado: 45 a 60 minutos la primera vez. No necesitas saber programar.

## Paso 0. Comprueba que el código funciona (sin cuentas, sin costo)

Instala [Node.js](https://nodejs.org) (versión 18 o más nueva), descarga este repositorio y, dentro de su carpeta:

```bash
npm test
```

Debe terminar con `TODAS LAS PRUEBAS OK`. Esto prueba la lógica de cálculo y los candados, sin internet.

## Paso 1. Ten un n8n

Sirve cualquier n8n 1.x, en tu computadora o en un servidor. Guía oficial: <https://docs.n8n.io/hosting/>.

## Paso 2. Consigue una llave de JEV

1. Crea una cuenta en <https://jevmodel.org> y genera una API key.
2. Ten créditos: una corrida completa de 11 productos gastó unos 15.300. Con un solo producto, unos 1.400.
3. En n8n: **Credentials → Add credential → Header Auth**. Nombre: `jev_api`. Header: `Authorization`. Valor: `Bearer ` seguido de tu llave.

> La llave solo va en n8n. Nunca la pegues en un nodo, en este repositorio ni en un chat.

## Paso 3. Crea tu bot de Telegram

1. En Telegram, habla con **@BotFather**, escribe `/newbot` y guarda el token.
2. En n8n: **Credentials → Telegram API** con ese token. Nombre: `telegram_inventario`.
3. Escríbele un mensaje a tu bot y averigua tu *chat id* (el nodo Telegram Trigger de n8n lo muestra al recibir un mensaje).

## Paso 4. Prepara Google Sheets

1. En n8n, conecta una credencial **Google Sheets OAuth2** (guía de n8n: <https://docs.n8n.io/integrations/builtin/credentials/google/>).
2. Importa `workflows/inventario_crea_hoja.json` y córrelo **una vez a mano**. Crea la hoja `jev_inventario_demo` con 5 pestañas (productos, ventas, proveedores, decisiones, ordenes_compra) y datos ficticios con fechas hasta ayer.
3. Copia el ID de la hoja: es la parte larga de su URL, entre `/d/` y `/edit`.

## Paso 5. Importa el flujo principal

1. Importa `workflows/inventario_jev_decide.json` (en n8n: menú de tres puntos → Import from file). No trae horario automático: se corre desde su formulario.
2. Abre el nodo `config` (el primero después del formulario) y reemplaza los dos textos que dicen PEGA_AQUI por **tu** ID de hoja y **tu** chat id de Telegram. Es el único lugar donde van tus datos.
3. En los nodos que lo piden (`lee_hoja`, `guarda_bitacora`, `crea_ordenes`: Google Sheets; `pregunta_a_jev`: Header Auth; `avisa_telegram`: Telegram), elige **tus** credenciales. El JSON no trae ninguna.
4. **No lo actives todavía.** Actívalo solo cuando quieras que corra solo (ver [USO.md](USO.md)).

## Paso 6. Primera corrida

Ejecuta el flujo a mano con **un solo producto** (unos 1.400 créditos). Verifica en la hoja (pestaña `decisiones`) que apareció una fila y en Telegram que llegó el aviso. Una ejecución verde no basta: **mira el dato**.

## Paso 7 (recomendado). Avisos de error

Importa `workflows/inventario_errores.json`, pon tu chat id en su nodo `config` y elige tu credencial de Telegram, publícalo y elígelo como *Error Workflow* en los ajustes de los otros flujos. Así, si algo falla, te llega un aviso a Telegram. Ver [PROBLEMAS_CONOCIDOS.md](PROBLEMAS_CONOCIDOS.md).

## Si te atoras

Abre un *issue* diciendo el paso y el mensaje de error (sin pegar llaves ni tokens). Ese reporte mejora esta guía.
