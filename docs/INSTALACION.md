# Instalación, paso a paso

Esta guía te lleva de cero a tu primera decisión. No necesitas saber programar. Si algo no se entiende, es un error de la guía: abre un *issue* y la mejoramos.

**Tiempo:** unos 45 a 60 minutos la primera vez.
**Costo:** una consulta a JEV por producto, unos 1.400 créditos cada una. Para probar basta con **un** producto.

Si una palabra no la conoces, mira el [glosario](GLOSARIO.md).

## Lo que vas a tener al final

```
Formulario en n8n -> n8n calcula -> JEV decide -> n8n valida y ejecuta:
                                                  - una fila en tu hoja de Google (bitácora)
                                                  - un borrador de orden de compra (si aplica)
                                                  - un aviso en tu Telegram
```

## Antes de empezar: lo que necesitas

| Qué | Para qué | Dónde se consigue |
|---|---|---|
| Un n8n (versión 1.x) | Es donde corre todo | n8n Cloud en <https://n8n.io> (de pago, el más fácil) o instalado por ti: <https://docs.n8n.io/hosting/> |
| Una cuenta de Google | La hoja de cálculo | Tu cuenta de siempre |
| Un bot de Telegram | Recibir los avisos | Se crea gratis en el paso 1 |
| Una cuenta de JEV con créditos | Toma las decisiones | <https://jevmodel.org> |
| Node.js 18 o más nuevo (opcional) | Solo para el paso 0 | <https://nodejs.org> |

## Paso 0 (opcional). Comprueba que el código funciona

No necesita cuentas ni créditos. Con Node.js instalado, dentro de la carpeta del proyecto:

```bash
npm test
```

Debe terminar con `TODAS LAS PRUEBAS OK`.

## Paso 1. Guarda las credenciales en n8n

Las credenciales son las llaves de tus cuentas. Se guardan **solo** dentro de n8n (menú **Credentials**), nunca en los flujos ni en este repositorio.

**a) JEV.** Crea una llave en <https://jevmodel.org>. En n8n: **Credentials → Add credential → Header Auth**. Ponle de nombre `jev`. En *Name* escribe `Authorization`. En *Value* escribe la palabra Bearer, un espacio y tu llave.

**b) Google Sheets.** **Add credential → Google Sheets OAuth2 API**. Sigue la guía oficial de n8n: <https://docs.n8n.io/integrations/builtin/credentials/google/>. Es el paso más largo. Con n8n Cloud suele bastar con pulsar *Sign in with Google*.

**c) Telegram.** En Telegram busca **@BotFather**, escribe `/newbot`, ponle nombre y copia el token que te da. En n8n: **Add credential → Telegram API** y pega el token. Luego escríbele cualquier mensaje a tu bot: sin eso no puede escribirte.

## Paso 2. Averigua tu chat id de Telegram

Es el número que dice a quién se le envían los avisos. Una forma sencilla: en Telegram habla con **@userinfobot** y te responde con tu `Id`. Anótalo.

## Paso 3. Crea la hoja de ejemplo

1. En n8n: **Workflows → Create workflow**. Arriba a la derecha, el menú de tres puntos → **Import from file…** y elige `workflows/inventario_crea_hoja.json`.
2. Abre los nodos que usan Google (`crea_hoja`, `escribe_datos`, `da_formato`) y elige tu credencial de **Google Sheets** si el nodo no la trae.
3. Pulsa **Execute workflow**. Se crea en tu Google Drive una hoja llamada `jev_inventario_demo` con 5 pestañas y datos ficticios.
4. Abre la hoja y copia su **ID**: es la parte larga de la dirección, entre `/d/` y `/edit`.

**Cómo saber que salió bien:** en tu Drive aparece la hoja con las pestañas `productos` (12 filas), `ventas`, `proveedores`, `decisiones` y `ordenes_compra` (estas dos últimas solo con encabezados).

## Paso 4. Importa y configura el flujo principal

1. Importa `workflows/inventario_jev_decide.json` igual que antes.
2. Abre el nodo **config**. Reemplaza los dos textos `PEGA_AQUI…`:
   - `sheet_id`: el ID de la hoja del paso 3.
   - `chat_id`: tu chat id del paso 2.

   Es el único lugar donde van tus datos.
3. Elige **tus** credenciales en los nodos que las piden:
   - `lee_hoja`, `guarda_bitacora` y `crea_ordenes`: Google Sheets.
   - `pregunta_a_jev`: la credencial `jev`.
   - `avisa_telegram`: tu credencial de Telegram.
4. Guarda el flujo (Ctrl+S). **No lo publiques todavía**: no hace falta para probar.

## Paso 5. Primera corrida, con un solo producto

1. Pulsa **Execute workflow**. n8n deja el formulario de prueba esperando.
2. Abre el formulario (n8n te muestra su enlace; termina en `/form-test/inventario-jev`). En **Solo este SKU** escribe `CAR-GAN-65` y pulsa **Analizar**. Responde que el análisis está en marcha.
3. En menos de un minuto debería llegarte un aviso por Telegram.

**Cómo saber que salió bien (mira el dato, no solo el color verde):**
- En tu hoja, pestaña `decisiones`, hay **una fila nueva** para `CAR-GAN-65` con la decisión, la confianza y las probabilidades de JEV.
- Te llegó el aviso a Telegram.

**Ejemplo de una prueba real:** JEV eligió `PRIORITIZE` con 57% de confianza. Como es menos del 60%, el candado de n8n lo frenó: la columna `decidido_por` dice `candado`, no se creó orden de compra y el motivo quedó escrito. Es el comportamiento esperado. La decisión puede variar entre corridas, porque la toma el modelo.

## Paso 6 (recomendado). Avisos cuando algo falla

1. Importa `workflows/inventario_errores.json`.
2. En su nodo `config` pon tu chat id y elige tu credencial de Telegram.
3. Publícalo. Luego, en el flujo principal: menú de tres puntos → **Settings** → **Error workflow** → elige `inventario_errores`.

Desde ahí, si el flujo falla en una ejecución normal, te llega un aviso a Telegram con el nodo que falló y una pista de qué revisar.

## Paso 7 (opcional). Todo el inventario

Ejecuta el flujo y deja **vacío** el campo SKU: analiza los 12 productos. Gasta unos 15.000 créditos y tarda unos minutos, porque las consultas a JEV se envían de una en una a propósito (ver [problemas conocidos](PROBLEMAS_CONOCIDOS.md)).

Para volver a empezar con datos limpios usa `workflows/inventario_reinicia_demo.json` (pon el ID de tu hoja en su nodo `config`): borra decisiones y órdenes y repone los datos de ejemplo con fechas de hoy. No gasta créditos.

## Si te atoras

- Mira [PROBLEMAS_CONOCIDOS.md](PROBLEMAS_CONOCIDOS.md).
- Abre un *issue* diciendo en qué paso estás y qué mensaje sale. **No pegues llaves ni tokens.**
