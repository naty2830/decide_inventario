// Prueba local de la logica (sin llamar a JEV): node herramientas/prueba_logica.js
// Usa los mismos datos de demo y respuestas de JEV SIMULADAS para revisar calculos, candados y mensajes.

const { generarDemo } = require('../src/generador_demo');
const L = require('../src/logica_inventario');

const HOY = '2026-09-28';
const demo = generarDemo(HOY);
const hojas = { productos: demo.productos, ventas: demo.ventas, proveedores: demo.proveedores, ordenes_compra: [] };
const calc = L.calcularProductos(hojas, HOY, '');

let fallas = 0;
const espera = (cond, msg) => { if (!cond) { fallas++; console.log('FALLA:', msg); } };

espera(calc.length === 12, '12 productos activos');
const roto = calc.find(c => c.sku === 'FUN-S24U-PREM');
espera(roto && !roto.valido && /negativo/.test(roto.motivo_invalido), 'stock negativo frena sin JEV');
const auto = calc.find(c => c.sku === 'SOP-AUTO-MAG');
espera(/before the stockout/.test(auto.estado.planning_math_by_n8n.planning_rate_method), 'agotado usa ritmo previo');
const gamer = calc.find(c => c.sku === 'AUD-GAMER-X');
espera(/excluding the spike/.test(gamer.estado.planning_math_by_n8n.planning_rate_method), 'pico excluido');
espera(calc.every(c => !c.valido || !JSON.stringify(c.estado).includes('historia')), 'historia_demo nunca va a JEV');

console.log('\nsku            | ritmo | cobertura | pedido | costo  | dias_tras | chars_estado');
for (const c of calc) {
  if (!c.valido) { console.log(c.sku.padEnd(15), '| INVALIDO:', c.motivo_invalido); continue; }
  const m = c.estado.planning_math_by_n8n;
  console.log(c.sku.padEnd(15), '|', String(m.planning_rate_units_per_day).padEnd(5), '|', String(m.days_of_cover_at_last_7_days_rate).padEnd(9), '|',
    String(m.order_size_if_ordering_today_units).padEnd(6), '|', String(m.order_cost_if_ordering_today_usd).padEnd(6), '|',
    String(m.days_of_stock_after_that_order).padEnd(9), '|', JSON.stringify(c.estado).length);
}
const cuerpo = { model: 'jev-1.13.0', state: calc[1].estado, questions: L.preguntasJev() };
console.log('\nTamano de una consulta completa:', JSON.stringify(cuerpo).length, 'caracteres (~', Math.round(JSON.stringify(cuerpo).length / 3.6), 'tokens)');

// Respuestas simuladas para probar cada rama del interprete
const simula = (choice, conf, extra) => Object.assign({
  statusCode: 200, headers: { 'x-credits-remaining': '88000' },
  body: { model: 'jev-1.13.0', usage: { input_tokens: 1200 }, answers: {
    decision: { type: 'choice', choice, confidence: conf, probabilities: { [choice]: conf } },
    urgency: { type: 'score', score: 2.4 }, stockout_risk: { noul: 0.9 }, real_demand_growth: { noul: 0.7 }, overstock_risk: { noul: 0.1 } } }
}, extra || {});
const ctx = { fecha: HOY + 'T13:00:00.000Z', corrida_id: 'prueba-local' };
const decide = { 'FUN-IP15-SIL': simula('WAIT', 0.9), 'CAR-GAN-65': simula('PRIORITIZE', 0.95), 'AUD-TWS-PRO': simula('WAIT', 0.85),
  'CAB-USBC-1M': simula('REORDER', 0.8), 'POP-GRIP-BAS': simula('ALERT', 0.88), 'AUD-GAMER-X': simula('HUMAN_REVIEW', 0.7),
  'PROT-S24-VID': simula('PRIORITIZE', 0.97), 'POW-10K-SLIM': simula('REORDER', 0.55), 'CAB-LIGHT-2M': simula('BUY_EVERYTHING', 0.9),
  'SOP-AUTO-MAG': { error: { message: 'timeout of 30000ms exceeded' } }, 'MIC-LAV-USBC': simula('ALERT', 0.8) };
const res = calc.map(c => L.interpretarDecision(c, decide[c.sku], ctx));
const por = sku => res.find(x => x.fila.sku === sku);
espera(por('POW-10K-SLIM').final === 'HUMAN_REVIEW' && por('POW-10K-SLIM').fila.decidido_por === 'candado', 'confianza baja -> humano');
espera(por('CAB-LIGHT-2M').final === 'HUMAN_REVIEW', 'opcion fuera de menu -> humano');
espera(por('SOP-AUTO-MAG').fila.decidido_por === 'fallback', 'JEV caido -> fallback');
espera(por('CAR-GAN-65').orden && por('CAR-GAN-65').orden.prioridad === 'alta', 'PRIORITIZE crea orden alta');
espera(por('FUN-S24U-PREM').fila.decidido_por === 'candado_datos', 'dato roto -> candado_datos');

// Candado de orden duplicada
const conOrden = L.calcularProductos(Object.assign({}, hojas, { ordenes_compra: [{ sku: 'CAB-USBC-1M', cantidad: 100, estado: 'borrador' }] }), HOY, 'CAB-USBC-1M');
const dup = L.interpretarDecision(conOrden[0], simula('REORDER', 0.9), ctx);
espera(conOrden.length === 1 && dup.fila.accion_n8n === 'NO_DUPLICA_ORDEN' && !dup.orden, 'orden abierta -> no duplica (y filtro por sku)');

// Ventas desactualizadas (correr la hoja 20 dias despues)
const tarde = L.calcularProductos(hojas, '2026-10-18', '');
espera(tarde.every(c => !c.valido && /desactualizadas/.test(c.motivo_invalido)), 'ventas viejas -> candado');

const bajaWait = L.interpretarDecision(calc[0], simula('WAIT', 0.3), ctx);
espera(bajaWait.final === 'WAIT' && bajaWait.fila.decidido_por === 'jev' && bajaWait.fila.accion_n8n === 'SOLO_REGISTRA' && /Confianza baja/.test(bajaWait.fila.motivo_candado), 'WAIT con confianza baja se muestra tal cual');
const bajaAlerta = L.interpretarDecision(calc[4], simula('ALERT', 0.2), ctx);
espera(bajaAlerta.final === 'ALERT' && bajaAlerta.fila.decidido_por === 'jev', 'ALERT con confianza baja se muestra tal cual');
const bajaCompra = L.interpretarDecision(calc[1], simula('PRIORITIZE', 0.38), ctx);
espera(bajaCompra.final === 'HUMAN_REVIEW' && !bajaCompra.orden && bajaCompra.fila.decidido_por === 'candado', 'PRIORITIZE con confianza baja NO compra');
const sin401 = L.interpretarDecision(calc[1], { error: { message: '401 - "{\\"error\\":{\\"type\\":\\"authentication_error\\"}}"' } }, ctx);
espera(/llave de JEV falta o no es valida/.test(sin401.fila.motivo_candado) && !/{/.test(sin401.fila.motivo_candado) && !sin401.orden, 'error 401 se explica sin JSON y no compra');
const msgs = L.armarMensajes(res, ctx);
espera(/1 sin respuesta de JEV/.test(msgs[0].texto) && /10 productos decididos por JEV/.test(msgs[0].texto), 'el resumen cuenta bien los sin respuesta');
const sinCred = L.interpretarDecision(calc[1], { error: { message: '402 - insufficient_credits' } }, ctx);
espera(/no hay creditos suficientes/.test(sinCred.fila.motivo_candado) && !/http/i.test(sinCred.fila.motivo_candado.replace('HTTP 402','')), 'error 402 se explica sin JSON crudo');
console.log('\n=== Mensajes Telegram (' + msgs.length + ') ===');
for (const m of msgs) console.log('---- (' + m.texto.length + ' chars)\n' + m.texto);
console.log(fallas ? '\n' + fallas + ' FALLAS' : '\nTODAS LAS PRUEBAS OK');
process.exit(fallas ? 1 : 0);
