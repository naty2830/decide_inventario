# Decide Inventario

**Proyecto #01 de [Taller Pyme](https://github.com/naty2830/taller_pyme)**, una iniciativa que
publica herramientas empresariales abiertas, una a la vez, para pequeñas empresas y para quien está aprendiendo.

> *Proyecto independiente: **no está afiliado** a JEV ni a n8n.*

Un inventario donde la IA **decide por contexto** en vez de aplicar una regla fija.
Tener poco stock no significa automáticamente que haya que comprar.

```
n8n calcula  →  un modelo decide  →  n8n valida y ejecuta
```

## Qué problema resuelve

La regla clásica dice: *"si el stock dura menos de lo que tarda el proveedor, compra"*. Se equivoca
justo donde más cuesta:

- compra un producto que se está dejando de vender, solo porque queda poco;
- compra de más tras un pico raro de ventas;
- no avisa cuando un producto deja de venderse de golpe teniendo stock;
- no distingue "no vende porque nadie lo quiere" de "no vende porque está agotado".

## Qué hace

Para cada producto de una hoja de Google Sheets:

1. **n8n calcula** velocidad de venta, tendencia, días de cobertura, clientes esperando, unidades en camino y fiabilidad del proveedor.
2. **El modelo decide** una acción de un menú cerrado: reabastecer, priorizar, esperar, alertar o pedir revisión humana. También da urgencia y tres señales (riesgo de quiebre, demanda real al alza, riesgo de sobrestock).
3. **n8n valida y ejecuta**: crea un **borrador** de orden de compra (la cantidad la calcula una fórmula, no el modelo), anota todo en una bitácora y avisa por Telegram.

### Candados (lo que el modelo no puede saltarse)

| Situación | Qué pasa |
|---|---|
| Dato imposible (ej. stock negativo) | No se consulta al modelo; se avisa |
| Compra con menos de 60% de confianza | No se compra; lo decide una persona |
| Ya hay una orden abierta del producto | No se duplica |
| El modelo no responde | No se compra nada; revisión humana |

## Ejemplo con datos ficticios

Tienda ficticia de accesorios para celular, mismos datos para la regla fija y para el modelo:

| Producto | Regla fija | Modelo |
|---|---|---|
| Audífonos gamer: un día vendió 34, lo normal es 1 | Compra | **Revisión humana** |
| Funda iPhone 15: poco stock, demanda -50% | Compra 100 u | **Esperar** |
| Micrófono: una semana sin vender, 64 en stock | Silencio | **Alerta** |
| Protector S24: 26 clientes esperando, 20 en stock | Compra | **Priorizar**, urgencia máxima |

Detalle en [examples/corrida_ejemplo.md](examples/corrida_ejemplo.md).

## Qué necesitas (y qué cuesta)

| Pieza | Para qué | Costo / licencia |
|---|---|---|
| [n8n](https://n8n.io) | Orquestar el flujo | Gratis autoalojado; licencia *fair-code* (no es OSI) |
| [JEV](https://jevmodel.org) | Toma la decisión | **Servicio de terceros, con créditos** (≈1.400 tokens de entrada por producto) |
| Google Sheets | Datos y bitácora | Gratis con cuenta Google |
| Telegram (bot) | Avisos | Gratis |
| Node.js 18+ | Solo para correr las pruebas y generar datos | Gratis, sin paquetes npm |

Dependencias propietarias, dichas sin rodeos: **JEV, Google Sheets y Telegram**. Reemplazar Google
Sheets y Telegram está en el [ROADMAP](ROADMAP.md).

**Este repositorio no trae ninguna credencial ni dato personal.** Cada persona usa sus propias cuentas y llaves (n8n, JEV, Google, Telegram) y las guarda en el sistema de credenciales de n8n.

## Empezar

1. [docs/INSTALACION.md](docs/INSTALACION.md): de cero a primera corrida.
2. [docs/USO.md](docs/USO.md): cómo usarlo día a día.
3. [docs/COMO_FUNCIONA.md](docs/COMO_FUNCIONA.md): para entenderlo y modificarlo.

Para comprobar que el código funciona sin cuentas ni créditos:

```bash
npm test
```

## Estado honesto

- Probado **por su autora** con datos ficticios: una corrida completa de 11 productos, una falla provocada a propósito (llave inválida) y una alerta real de error.
- La decisión coincide dentro de n8n y en el Playground de JEV (diferencias de 1-2 puntos porcentuales).
- No se ha usado con datos reales de un negocio ni por otras personas.
- Los flujos en `workflows/` se generaron a partir de los que se probaron, sin credenciales ni datos personales. Falta probar la instalación completa importándolos en un n8n limpio.

## Autoría

Hecho por Nat-IA-Tec, con ayuda de Claude Code (Anthropic).

## Licencia

MIT, © Nat-IA-Tec. Ver [LICENSE](LICENSE). Los servicios de terceros tienen sus propios términos.
