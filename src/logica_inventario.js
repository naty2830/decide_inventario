// FUENTE UNICA de la logica del flujo inventario_jev_decide.
// Cada funcion se copia TAL CUAL dentro de los nodos Code de n8n (ver construye_flujos.js),
// asi lo que se prueba aqui es exactamente lo que corre en n8n.
//
// Reparto de trabajo:  n8n CALCULA (calcularProductos)  ->  JEV DECIDE  ->  n8n VALIDA y EJECUTA (interpretarDecision)

// ---------- 1. n8n CALCULA ----------
// hojas: { productos:[{...}], ventas:[{...}], proveedores:[{...}], ordenes_compra:[{...}] } (filas ya como objetos)
function calcularProductos(hojas, HOY, soloSku) {
  const DIAS = 28;
  const MS = 86400000;
  const redondea = (x, d) => (x === null || x === undefined || !isFinite(x)) ? null : Math.round(x * Math.pow(10, d)) / Math.pow(10, d);
  const num = v => (v === '' || v === null || v === undefined) ? NaN : Number(v);
  const diaISO = v => {
    if (typeof v === 'number') return new Date(Math.round((v - 25569) * MS)).toISOString().slice(0, 10); // serial de Sheets
    return String(v || '').trim().slice(0, 10);
  };
  const hoyMs = Date.parse(HOY + 'T00:00:00Z');
  const fechaDia = i => new Date(hoyMs - (DIAS - i) * MS).toISOString().slice(0, 10); // i=0 hace 28 dias, i=27 ayer

  const proveedores = {};
  for (const p of hojas.proveedores || []) proveedores[String(p.proveedor || '').trim()] = p;

  const ventasPorSku = {};
  let ultimaVenta = '';
  for (const v of hojas.ventas || []) {
    const sku = String(v.sku || '').trim();
    const f = diaISO(v.fecha);
    if (!sku || !f) continue;
    if (f > ultimaVenta) ultimaVenta = f;
    (ventasPorSku[sku] = ventasPorSku[sku] || {})[f] = ((ventasPorSku[sku] || {})[f] || 0) + num(v.unidades);
  }

  const ordenesAbiertas = {};
  for (const o of hojas.ordenes_compra || []) {
    const estado = String(o.estado || '').trim().toLowerCase();
    if (estado === 'borrador' || estado === 'enviada') {
      const sku = String(o.sku || '').trim();
      ordenesAbiertas[sku] = (ordenesAbiertas[sku] || 0) + (num(o.cantidad) || 0);
    }
  }

  const filtro = String(soloSku || '').trim().toUpperCase();
  const salida = [];

  for (const p of hojas.productos || []) {
    const sku = String(p.sku || '').trim();
    if (!sku) continue;
    if (String(p.activo || '').trim().toLowerCase() !== 'si') continue;
    if (filtro && sku.toUpperCase() !== filtro) continue;

    const prov = proveedores[String(p.proveedor || '').trim()];
    const costo = num(p.costo_unitario), precio = num(p.precio_venta);
    const stock = num(p.stock_actual), pendientes = num(p.pedidos_clientes_pendientes);
    const enCamino = num(p.unidades_en_camino) || 0, moq = num(p.pedido_minimo);
    const llegada = diaISO(p.fecha_llegada_en_camino);
    const ventasSku = ventasPorSku[sku] || {};
    const diasConDato = Object.keys(ventasSku).filter(f => f >= fechaDia(0) && f < HOY).length;

    // --- candado de datos: si algo es imposible o falta, NO se consulta a JEV ---
    const problemas = [];
    if (!isFinite(stock)) problemas.push('stock_actual vacio o no numerico');
    else if (stock < 0) problemas.push('stock_actual negativo (' + stock + ')');
    if (!isFinite(pendientes) || pendientes < 0) problemas.push('pedidos_clientes_pendientes invalido');
    if (!isFinite(enCamino) || enCamino < 0) problemas.push('unidades_en_camino invalido');
    if (enCamino > 0 && !/^\d{4}-\d{2}-\d{2}$/.test(llegada)) problemas.push('hay unidades en camino sin fecha de llegada');
    if (!isFinite(costo) || costo <= 0) problemas.push('costo_unitario invalido');
    if (!isFinite(precio) || precio <= 0) problemas.push('precio_venta invalido');
    if (!isFinite(moq) || moq <= 0) problemas.push('pedido_minimo invalido');
    if (!prov) problemas.push('proveedor "' + p.proveedor + '" no existe en la pestana proveedores');
    else if (!(num(prov.tiempo_reposicion_dias) > 0)) problemas.push('tiempo_reposicion_dias invalido para ' + p.proveedor);
    if (diasConDato < 14) problemas.push('ventas desactualizadas o incompletas: solo ' + diasConDato + ' de los ultimos 28 dias tienen datos (ultima venta registrada: ' + (ultimaVenta || 'ninguna') + ')');
    for (const f of Object.keys(ventasSku)) if (!(ventasSku[f] >= 0)) { problemas.push('hay ventas negativas o no numericas el ' + f); break; }

    const base = {
      sku, producto: String(p.producto || sku), proveedor: String(p.proveedor || ''),
      costo_unitario: costo, orden_abierta_unidades: ordenesAbiertas[sku] || 0
    };
    if (problemas.length) {
      salida.push(Object.assign(base, { valido: false, motivo_invalido: problemas.join('; ') }));
      continue;
    }

    // --- metricas de ventas ---
    const serie = [];
    for (let i = 0; i < DIAS; i++) serie.push(ventasSku[fechaDia(i)] || 0);
    const suma = a => a.reduce((s, x) => s + x, 0);
    const v7 = suma(serie.slice(-7)) / 7;
    const vPrev21 = suma(serie.slice(0, 21)) / 21;
    const v28 = suma(serie) / DIAS;
    const ordenada = serie.slice().sort((a, b) => a - b);
    const mediana = (ordenada[13] + ordenada[14]) / 2;
    const maximo = Math.max.apply(null, serie);
    const diaMax = fechaDia(serie.indexOf(maximo));
    let cerosAlFinal = 0;
    for (let i = serie.length - 1; i >= 0 && serie[i] === 0; i--) cerosAlFinal++;
    const tendencia = vPrev21 > 0 ? (v7 - vPrev21) / vPrev21 * 100 : null;

    // Ritmo que usa n8n para calcular cantidades (determinista, documentado):
    //  - si esta agotado y lleva dias en cero: el ritmo de ANTES de agotarse (la demanda no desaparecio)
    //  - si hay un pico aislado (>= 5 veces la mediana): promedio de 28 dias SIN el dia del pico
    //  - si no: 60% ultima semana + 40% las 3 semanas anteriores
    let ritmo, criterioRitmo;
    const picoAislado = maximo >= 5 * Math.max(mediana, 1);
    if (stock <= 0 && cerosAlFinal >= 2) {
      const antes = serie.slice(Math.max(0, DIAS - cerosAlFinal - 14), DIAS - cerosAlFinal);
      ritmo = antes.length ? suma(antes) / antes.length : v28;
      criterioRitmo = 'rate before the stockout (last ' + antes.length + ' days with stock)';
    } else if (picoAislado) {
      ritmo = (suma(serie) - maximo) / (DIAS - 1);
      criterioRitmo = '28-day average excluding the spike day';
    } else {
      ritmo = 0.6 * v7 + 0.4 * vPrev21;
      criterioRitmo = '60% last 7 days + 40% previous 21 days';
    }

    const reposicion = num(prov.tiempo_reposicion_dias);
    const disponible = stock - pendientes;
    const diasLlegada = enCamino > 0 ? Math.round((Date.parse(llegada + 'T00:00:00Z') - hoyMs) / MS) : null;
    const llegaAntes = enCamino > 0 && diasLlegada <= reposicion;
    const coberturaActual = v7 > 0 ? disponible / v7 : null;
    const coberturaConCamino = ritmo > 0 ? (disponible + enCamino) / ritmo : null;
    const demandaReposicion = ritmo * reposicion;
    const necesarias = Math.ceil(ritmo * (reposicion + 14) - (disponible + enCamino) - (ordenesAbiertas[sku] || 0));
    const cantidad = Math.max(necesarias, moq);
    const diasTrasPedido = ritmo > 0 ? (disponible + enCamino + cantidad) / ritmo : null;

    const estado = {
      store: 'Small online store selling phone accessories. The inventory manager wants a decision for ONE product today.',
      analysis_date: HOY,
      product: {
        sku, name: base.producto, category: String(p.categoria || ''),
        unit_cost_usd: costo, unit_price_usd: precio,
        gross_margin_pct: redondea((precio - costo) / precio * 100, 0)
      },
      stock: {
        on_hand: stock,
        pending_customer_orders_waiting: pendientes,
        available_after_pending_orders: disponible,
        incoming_units_from_supplier: enCamino,
        incoming_arrives_in_days: diasLlegada,
        open_purchase_order_units_not_yet_shipped: ordenesAbiertas[sku] || 0,
        inventory_value_at_cost_usd: redondea(Math.max(stock, 0) * costo, 2)
      },
      sales: {
        daily_units_last_28_days_oldest_first: serie,
        avg_per_day_last_7_days: redondea(v7, 2),
        avg_per_day_previous_21_days: redondea(vPrev21, 2),
        trend_last_7_vs_previous_21_pct: redondea(tendencia, 0),
        median_day: mediana,
        max_single_day: maximo,
        max_day_date: diaMax,
        consecutive_zero_sales_days_until_yesterday: cerosAlFinal
      },
      supplier: {
        name: String(prov.nombre || prov.proveedor), country: String(prov.pais || ''),
        lead_time_days: reposicion,
        on_time_delivery_pct: num(prov.entregas_a_tiempo_pct),
        minimum_order_units: moq
      },
      planning_math_by_n8n: {
        planning_rate_units_per_day: redondea(ritmo, 2),
        planning_rate_method: criterioRitmo,
        days_of_cover_at_last_7_days_rate: redondea(coberturaActual, 1),
        days_of_cover_incl_incoming_at_planning_rate: redondea(coberturaConCamino, 1),
        incoming_arrives_before_a_new_order_could: enCamino > 0 ? llegaAntes : null,
        expected_demand_during_lead_time_units: redondea(demandaReposicion, 0),
        units_needed_to_cover_lead_time_plus_14_days: Math.max(0, necesarias),
        order_size_if_ordering_today_units: cantidad,
        order_cost_if_ordering_today_usd: redondea(cantidad * costo, 2),
        days_of_stock_after_that_order: redondea(diasTrasPedido, 0)
      }
    };

    salida.push(Object.assign(base, {
      valido: true, motivo_invalido: '',
      cantidad_sugerida: cantidad, costo_orden: redondea(cantidad * costo, 2),
      resumen_hechos: {
        stock, pendientes, en_camino: enCamino, llegada_dias: diasLlegada,
        v7: redondea(v7, 1), tendencia: redondea(tendencia, 0),
        cobertura: redondea(coberturaActual, 0), reposicion, ceros: cerosAlFinal,
        pico: picoAislado ? maximo : null, dias_tras_pedido: redondea(diasTrasPedido, 0)
      },
      estado
    }));
  }
  return salida;
}

// ---------- 2. Las preguntas a JEV (fijas: JEV solo elige de este menu) ----------
function preguntasJev() {
  return {
    decision: {
      type: 'choice',
      instructions: 'You are the inventory planner of this store. Decide what to do with this product today. Low stock alone does NOT mean reorder: weigh the demand trend, customers already waiting, incoming stock, supplier lead time and reliability, the minimum order size, the risk of excess inventory and any anomaly in the sales data.',
      criteria: {
        REORDER: 'Place a normal replenishment order now: stock will run out around or before a new order could arrive, demand is healthy, and the order will not leave excessive inventory.',
        PRIORITIZE: 'Urgent replenishment that must be handled first today: customers are already waiting or a stockout is imminent or already happening while demand is real, so waiting would lose sales or customers.',
        WAIT: 'Do not order now: available plus incoming stock covers demand until a later order could arrive, or demand is falling so an order would likely create excess stock.',
        ALERT: 'No purchase, but a person should look at it: excess inventory tying up money, or abnormal sales behaviour while stock is available (for example sales suddenly stopped).',
        HUMAN_REVIEW: 'Ambiguous or high-risk: signals conflict, demand may be a one-off spike or a data error, or an expensive order would rest on uncertain demand. A person must decide before buying.'
      }
    },
    urgency: {
      type: 'score',
      instructions: 'How urgent is it to act on this product?',
      criteria: ['none: nothing to do this week', 'low: review within the week', 'high: act within 1-2 days', 'critical: act today, sales or customers are being lost']
    },
    stockout_risk: {
      type: 'noul',
      instructions: 'Will this product be unable to serve customers before a new order placed today could arrive (considering customers already waiting and incoming units)?'
    },
    real_demand_growth: {
      type: 'noul',
      instructions: 'Is genuine customer demand for this product growing, and not just a one-off spike, a data error or an effect of being out of stock?'
    },
    overstock_risk: {
      type: 'noul',
      instructions: 'If the store placed the order described in planning_math_by_n8n today, would it likely end up with excess inventory (well over 60 days of sales) or money tied up in slow stock?'
    }
  };
}

// ---------- 3. n8n VALIDA la decision de JEV y decide que EJECUTA ----------
// calc = un item de calcularProductos; r = salida del nodo HTTP (fullResponse) o del candado de datos
function interpretarDecision(calc, r, contexto) {
  const MENU = ['REORDER', 'PRIORITIZE', 'WAIT', 'ALERT', 'HUMAN_REVIEW'];
  const ACCION = { REORDER: 'CREA_ORDEN', PRIORITIZE: 'CREA_ORDEN_URGENTE', WAIT: 'SOLO_REGISTRA', ALERT: 'AVISA_ALERTA', HUMAN_REVIEW: 'PIDE_REVISION' };
  const CONFIANZA_MINIMA = 0.6;
  const r2 = x => (typeof x === 'number' && isFinite(x)) ? Math.round(x * 100) / 100 : '';

  const fila = {
    fecha: contexto.fecha, corrida_id: contexto.corrida_id, sku: calc.sku, producto: calc.producto,
    datos_enviados_a_jev: calc.valido ? JSON.stringify(calc.estado) : '',
    decision_jev: '', confianza_jev: '', probabilidades_jev: '', urgencia_jev: '',
    riesgo_quiebre_jev: '', demanda_creciente_jev: '', riesgo_sobrestock_jev: '',
    accion_n8n: '', decidido_por: '', motivo_candado: '',
    cantidad_sugerida: '', costo_orden: '', modelo: '', tokens: '', creditos_restantes: ''
  };

  if (!calc.valido) {
    fila.decision_jev = 'NO_CONSULTADO';
    fila.accion_n8n = 'PIDE_REVISION';
    fila.decidido_por = 'candado_datos';
    fila.motivo_candado = 'Datos invalidos, no se gasto consulta a JEV: ' + calc.motivo_invalido;
    return { fila, orden: null, calc, final: 'HUMAN_REVIEW' };
  }

  const ok = r && r.statusCode === 200 && r.body && r.body.answers && r.body.answers.decision;
  let final;
  if (!ok) {
    const crudo = (r && r.statusCode) ? ('HTTP ' + r.statusCode) : ((r && r.error && (r.error.message || r.error)) || 'sin respuesta');
    const causa = /insufficient_credits/.test(String(crudo)) ? 'HTTP 402: JEV dice que no hay creditos suficientes'
      : /authentication_error|invalid api key|\b401\b/i.test(String(crudo)) ? 'HTTP 401: la llave de JEV falta o no es valida; revisar la credencial "jev" en n8n'
      : /timeout|ETIMEDOUT|ECONNRESET|ECONNREFUSED/i.test(String(crudo)) ? 'JEV tardo demasiado o se corto la conexion'
      : /\b5\d\d\b/.test(String(crudo)) ? 'JEV tuvo una falla temporal de su lado (' + (String(crudo).match(/\b5\d\d\b/) || [''])[0] + ')'
      : crudo;
    fila.decision_jev = 'SIN_RESPUESTA';
    fila.decidido_por = 'fallback';
    fila.motivo_candado = 'JEV no respondio (' + String(causa).slice(0, 200) + '). Por seguridad se pide revision humana.';
    final = 'HUMAN_REVIEW';
  } else {
    const a = r.body.answers;
    const d = a.decision;
    fila.decision_jev = d.choice;
    fila.confianza_jev = r2(d.confidence);
    fila.probabilidades_jev = JSON.stringify(d.probabilities || {});
    fila.urgencia_jev = (a.urgency && typeof a.urgency.score === 'number') ? r2(a.urgency.score + 1) : '';
    fila.riesgo_quiebre_jev = a.stockout_risk ? r2(a.stockout_risk.noul) : '';
    fila.demanda_creciente_jev = a.real_demand_growth ? r2(a.real_demand_growth.noul) : '';
    fila.riesgo_sobrestock_jev = a.overstock_risk ? r2(a.overstock_risk.noul) : '';
    fila.modelo = r.body.model || '';
    fila.tokens = (r.body.usage && r.body.usage.input_tokens) || '';
    fila.creditos_restantes = (r.headers && (r.headers['x-credits-remaining'] || r.headers['x-tokens-remaining'])) || '';
    fila.decidido_por = 'jev';
    final = d.choice;
    if (MENU.indexOf(final) < 0) {
      fila.decidido_por = 'candado';
      fila.motivo_candado = 'JEV devolvio una opcion fuera del menu (' + final + ').';
      final = 'HUMAN_REVIEW';
    } else if (!(d.confidence >= CONFIANZA_MINIMA)) {
      const pctConf = Math.round((d.confidence || 0) * 100);
      if (final === 'REORDER' || final === 'PRIORITIZE') {
        fila.decidido_por = 'candado';
        fila.motivo_candado = 'JEV eligio ' + final + ' con solo ' + pctConf + '% de confianza (minimo ' + (CONFIANZA_MINIMA * 100) + '% para gastar dinero). No se compra: lo decide una persona.';
        final = 'HUMAN_REVIEW';
      } else {
        fila.motivo_candado = 'Confianza baja (' + pctConf + '%): decision de JEV mostrada tal cual porque no gasta dinero.';
      }
    }
  }

  let accion = ACCION[final];
  let orden = null;
  if (final === 'REORDER' || final === 'PRIORITIZE') {
    if (calc.orden_abierta_unidades > 0) {
      accion = 'NO_DUPLICA_ORDEN';
      fila.decidido_por = 'candado';
      fila.motivo_candado = 'JEV pidio ' + final + ', pero ya hay una orden abierta de ' + calc.orden_abierta_unidades + ' unidades de este producto. No se duplica.';
    } else {
      fila.cantidad_sugerida = calc.cantidad_sugerida;
      fila.costo_orden = calc.costo_orden;
      orden = {
        fecha: contexto.fecha, corrida_id: contexto.corrida_id, sku: calc.sku, producto: calc.producto,
        proveedor: calc.proveedor, cantidad: calc.cantidad_sugerida, costo_unitario: calc.costo_unitario,
        costo_total: calc.costo_orden, prioridad: final === 'PRIORITIZE' ? 'alta' : 'normal', estado: 'borrador',
        decision_origen: final + ' ' + Math.round((fila.confianza_jev || 0) * 100) + '% (' + fila.decidido_por + ')'
      };
    }
  }
  fila.accion_n8n = accion;
  return { fila, orden, calc, final };
}

// ---------- 4. Mensajes de Telegram (resumen + un aviso por cada caso que necesita a una persona) ----------
function armarMensajes(resultados, contexto) {
  const esc = s => String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const pct = v => (v === '' || v === null || v === undefined) ? 's/d' : Math.round(Number(v) * 100) + '%';
  const urg = v => (v === '' || v === null || v === undefined) ? 's/d' : Number(v).toFixed(1);
  const usd = v => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const NOMBRE = { PRIORITIZE: 'PRIORIZAR', REORDER: 'REABASTECER', HUMAN_REVIEW: 'REVISION HUMANA', ALERT: 'ALERTA', WAIT: 'ESPERAR' };
  const ICONO = { PRIORITIZE: '🔴', REORDER: '🟢', HUMAN_REVIEW: '🟠', ALERT: '🟡', WAIT: '⚪' };
  const ORDEN = ['PRIORITIZE', 'REORDER', 'HUMAN_REVIEW', 'ALERT', 'WAIT'];

  const hechos = c => {
    const h = c.resumen_hechos;
    if (!h) return '';
    const partes = ['stock ' + h.stock];
    if (h.pendientes) partes.push(h.pendientes + (h.pendientes === 1 ? ' cliente esperando' : ' clientes esperando'));
    if (h.en_camino) partes.push(h.en_camino + ' en camino (' + h.llegada_dias + ' d)');
    partes.push('vende ' + h.v7 + '/dia');
    if (h.tendencia !== null) partes.push('tendencia ' + (h.tendencia > 0 ? '+' : '') + h.tendencia + '%');
    partes.push('proveedor ' + h.reposicion + ' d');
    if (h.ceros >= 3) partes.push(h.ceros + ' dias sin vender');
    if (h.pico) partes.push('pico de ' + h.pico + ' en un dia');
    return partes.join(' · ');
  };
  const porque = f => 'quiebre ' + pct(f.riesgo_quiebre_jev) + ' · demanda real al alza ' + pct(f.demanda_creciente_jev) + ' · sobrestock ' + pct(f.riesgo_sobrestock_jev);

  const lista = resultados.slice().sort((a, b) => {
    const d = ORDEN.indexOf(a.final) - ORDEN.indexOf(b.final);
    return d !== 0 ? d : (Number(b.fila.urgencia_jev) || 0) - (Number(a.fila.urgencia_jev) || 0);
  });

  let t = '<b>JEV decidio · inventario ' + esc(contexto.fecha.slice(0, 10)) + '</b>\n';
  const frenados = resultados.filter(x => x.fila.decidido_por === 'candado_datos').length;
  const sinRespuesta = resultados.filter(x => x.fila.decision_jev === 'SIN_RESPUESTA').length;
  const consultados = resultados.length - frenados - sinRespuesta;
  t += consultados + (consultados === 1 ? ' producto decidido por JEV' : ' productos decididos por JEV');
  if (sinRespuesta) t += ' · ' + sinRespuesta + ' sin respuesta de JEV';
  if (frenados) t += ' · ' + frenados + ' frenado(s) por datos';
  t += '\n';
  let grupo = '';
  for (const x of lista) {
    const f = x.fila;
    if (x.final !== grupo) { grupo = x.final; t += '\n' + ICONO[grupo] + ' <b>' + NOMBRE[grupo] + '</b>\n'; }
    if (f.decidido_por === 'candado_datos') { t += '• ' + esc(f.producto) + ': dato roto, no se consulto a JEV\n'; continue; }
    t += '• <b>' + esc(f.producto) + '</b>';
    if (f.decidido_por === 'jev') t += ' · ' + pct(f.confianza_jev) + (Number(f.confianza_jev) < 0.6 ? ' (confianza baja)' : '') + ' · urgencia ' + urg(f.urgencia_jev) + '/4';
    else if (f.decision_jev === 'SIN_RESPUESTA') t += ' · JEV no respondio, lo decide una persona';
    else t += ' · JEV dijo ' + esc(NOMBRE[f.decision_jev] || f.decision_jev) + (f.confianza_jev !== '' ? ' ' + pct(f.confianza_jev) : '') + ', candado de n8n';
    t += '\n   ' + esc(porque(f));
    if (x.orden) t += '\n   → orden borrador ' + x.orden.cantidad + ' u · ' + usd(x.orden.costo_total);
    if (f.accion_n8n === 'NO_DUPLICA_ORDEN') t += '\n   → ya hay una orden abierta, no se duplica';
    t += '\n';
  }
  const conCreditos = resultados.filter(x => x.fila.creditos_restantes !== '');
  if (conCreditos.length) t += '\nCreditos JEV restantes: ' + conCreditos[conCreditos.length - 1].fila.creditos_restantes;
  if (t.length > 3900) t = t.slice(0, 3880) + '\n…(ver pestana decisiones)';

  const mensajes = [{ texto: t }];

  for (const x of lista) {
    const f = x.fila;
    if (x.final !== 'HUMAN_REVIEW' && x.final !== 'ALERT') continue;
    let m = ICONO[x.final] + ' <b>' + NOMBRE[x.final] + ': ' + esc(f.producto) + '</b> (' + esc(f.sku) + ')\n';
    if (f.decidido_por === 'candado_datos') {
      m += '\nNo se consulto a JEV porque los datos no son confiables:\n' + esc(x.calc.motivo_invalido) + '\n\nQue hacer: corregir la fila en la hoja y volver a correr el analisis.';
    } else {
      m += '\n' + esc(hechos(x.calc)) + '\n';
      if (f.decidido_por === 'jev') m += '\nJEV decidio ' + NOMBRE[x.final] + ' con ' + pct(f.confianza_jev) + ' de confianza' + (Number(f.confianza_jev) < 0.6 ? ' (baja)' : '') + ' (urgencia ' + urg(f.urgencia_jev) + '/4).\n';
      else m += '\nCandado de n8n: ' + esc(f.motivo_candado) + '\n';
      if (f.decision_jev !== 'SIN_RESPUESTA') m += 'Por que: ' + esc(porque(f)) + '\n';
      m += x.final === 'ALERT'
        ? '\nNo se compra nada. Revisa que esta pasando con este producto.'
        : '\nNo se compro nada. Si decides comprar, el calculo de n8n sugiere ' + x.calc.cantidad_sugerida + ' u (' + usd(x.calc.costo_orden) + ').';
    }
    mensajes.push({ texto: m });
  }
  return mensajes;
}

module.exports = { calcularProductos, preguntasJev, interpretarDecision, armarMensajes };
