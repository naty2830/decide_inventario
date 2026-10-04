// FUENTE UNICA de los datos de demo de la tienda ficticia de accesorios para celular.
// La funcion generarDemo se copia TAL CUAL dentro del nodo Code de n8n (ver construye_flujos.js),
// asi los datos de n8n y la vista previa local salen identicos.
// HOY = 'AAAA-MM-DD' del dia de la corrida; las ventas cubren los 28 dias anteriores (hasta ayer).

function generarDemo(HOY) {
  const DIAS = 28;
  function prng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function poisson(lambda, rnd) {
    if (lambda <= 0) return 0;
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= rnd(); } while (p > L);
    return k - 1;
  }
  function sumarDias(iso, n) {
    const d = new Date(iso + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  const proveedores = [
    { proveedor: 'shenzhen_case_factory', nombre: 'Shenzhen Case Factory', pais: 'China', tiempo_reposicion_dias: 21, entregas_a_tiempo_pct: 82, notas: 'Barato pero lento: envio maritimo y aduana' },
    { proveedor: 'audiotech_mayorista', nombre: 'AudioTech Mayorista', pais: 'Estados Unidos', tiempo_reposicion_dias: 7, entregas_a_tiempo_pct: 91, notas: 'Distribuidor de audio' },
    { proveedor: 'cables_y_mas', nombre: 'Cables y Mas Distribuidora', pais: 'Local', tiempo_reposicion_dias: 3, entregas_a_tiempo_pct: 98, notas: 'Rapido y confiable; vende por caja' },
    { proveedor: 'powerline_mexico', nombre: 'PowerLine Mexico', pais: 'Mexico', tiempo_reposicion_dias: 10, entregas_a_tiempo_pct: 87, notas: 'Baterias, soportes y protectores' }
  ];

  // perfil(d): ventas esperadas el dia d (0 = hace 28 dias, 27 = ayer)
  const catalogo = [
    ['FUN-IP15-SIL', 'Funda silicona iPhone 15', 'fundas', 'shenzhen_case_factory', 2.8, 14.99, 22, 0, 0, null, 100,
      'Poco stock, pero la demanda se esta cayendo (salio el iPhone 17), el proveedor tarda 21 dias y el pedido minimo es de 100.',
      d => 5.5 - d * 0.17],
    ['CAR-GAN-65', 'Cargador GaN 65W USB-C', 'cargadores', 'shenzhen_case_factory', 11.5, 39.99, 38, 4, 0, null, 40,
      'La demanda viene subiendo fuerte y el proveedor tarda 21 dias y a veces se atrasa.',
      d => 2 + d * 0.16],
    ['AUD-TWS-PRO', 'Audifonos inalambricos TWS Pro', 'audio', 'audiotech_mayorista', 14, 49.99, 24, 2, 60, 3, 30,
      'Stock bajo, pero ya hay 60 unidades en camino que llegan en 3 dias.',
      () => 2.6],
    ['CAB-USBC-1M', 'Cable USB-C a USB-C 1m', 'cables', 'cables_y_mas', 1.2, 8.99, 55, 3, 0, null, 100,
      'Producto estrella de alto volumen y demanda estable; con el stock actual alcanza para pocos dias.',
      () => 11],
    ['POP-GRIP-BAS', 'Soporte de agarre (grip) basico', 'accesorios', 'shenzhen_case_factory', 0.9, 6.99, 480, 0, 0, null, 200,
      'Sobrestock: hay mercancia para casi un ano y las ventas siguen bajando.',
      d => 3.2 - d * 0.07],
    ['AUD-GAMER-X', 'Audifonos gamer con microfono X', 'audio', 'audiotech_mayorista', 42, 99.99, 19, 0, 0, null, 20,
      'Producto caro: vende ~1 al dia, pero hace 4 dias tuvo un pico raro de 34 unidades (viral o error). Ambiguo y caro.',
      d => (d === 23 ? 34 : 1.1)],
    ['PROT-S24-VID', 'Protector de vidrio Galaxy S24', 'protectores', 'powerline_mexico', 0.7, 9.99, 20, 26, 0, null, 100,
      'Hay mas pedidos de clientes esperando (26) que stock (20): ya se esta quedando mal con clientes.',
      () => 4.5],
    ['POW-10K-SLIM', 'Bateria externa 10000mAh slim', 'baterias', 'powerline_mexico', 9, 29.99, 26, 1, 0, null, 25,
      'Demanda estable; el stock alcanza justo para lo que tarda el proveedor (10 dias).',
      () => 2.3],
    ['CAB-LIGHT-2M', 'Cable Lightning 2m', 'cables', 'cables_y_mas', 1.5, 9.99, 16, 0, 0, null, 100,
      'Poco stock, pero la demanda va bajando (los iPhone nuevos son USB-C) y el proveedor entrega en 3 dias.',
      d => 2.4 - d * 0.05],
    ['SOP-AUTO-MAG', 'Soporte magnetico para auto', 'soportes', 'powerline_mexico', 4.5, 19.99, 0, 5, 0, null, 30,
      'Agotado hace 6 dias: las ventas en cero NO son falta de demanda, es que no hay que vender.',
      d => (d >= 22 ? 0 : 3.4)],
    ['MIC-LAV-USBC', 'Microfono de solapa USB-C', 'audio', 'audiotech_mayorista', 7, 24.99, 64, 0, 0, null, 20,
      'Vendia ~2 al dia y de golpe lleva una semana en cero TENIENDO stock (posible publicacion caida o problema).',
      d => (d >= 22 ? 0 : 2.1)],
    ['FUN-S24U-PREM', 'Funda premium Galaxy S24 Ultra', 'fundas', 'shenzhen_case_factory', 6.5, 29.99, -5, 0, 0, null, 30,
      'Dato roto a proposito: stock negativo (error de conteo). n8n debe frenarlo sin consultar a JEV.',
      () => 1.4]
  ];

  const productos = catalogo.map(c => ({
    sku: c[0], producto: c[1], categoria: c[2], proveedor: c[3],
    costo_unitario: c[4], precio_venta: c[5], stock_actual: c[6],
    pedidos_clientes_pendientes: c[7], unidades_en_camino: c[8],
    fecha_llegada_en_camino: c[9] === null ? '' : sumarDias(HOY, c[9]),
    pedido_minimo: c[10], activo: 'si', historia_demo: c[11]
  }));

  const rnd = prng(20260928);
  const ventas = [];
  for (const c of catalogo) {
    for (let d = 0; d < DIAS; d++) {
      const f = sumarDias(HOY, d - DIAS);
      const dow = new Date(f + 'T12:00:00Z').getUTCDay();
      const finde = (dow === 0 || dow === 6) ? 1.2 : 1;
      const base = c[12](d);
      const u = (c[0] === 'AUD-GAMER-X' && d === 23) ? 34 : (base === 0 ? 0 : poisson(Math.max(0, base) * finde, rnd));
      ventas.push({ fecha: f, sku: c[0], unidades: u });
    }
  }

  const COLUMNAS = {
    productos: ['sku', 'producto', 'categoria', 'proveedor', 'costo_unitario', 'precio_venta', 'stock_actual',
      'pedidos_clientes_pendientes', 'unidades_en_camino', 'fecha_llegada_en_camino', 'pedido_minimo', 'activo', 'historia_demo'],
    ventas: ['fecha', 'sku', 'unidades'],
    proveedores: ['proveedor', 'nombre', 'pais', 'tiempo_reposicion_dias', 'entregas_a_tiempo_pct', 'notas'],
    decisiones: ['fecha', 'corrida_id', 'sku', 'producto', 'datos_enviados_a_jev', 'decision_jev', 'confianza_jev',
      'probabilidades_jev', 'urgencia_jev', 'riesgo_quiebre_jev', 'demanda_creciente_jev', 'riesgo_sobrestock_jev',
      'accion_n8n', 'decidido_por', 'motivo_candado', 'cantidad_sugerida', 'costo_orden', 'modelo', 'tokens', 'creditos_restantes'],
    ordenes_compra: ['fecha', 'corrida_id', 'sku', 'producto', 'proveedor', 'cantidad', 'costo_unitario', 'costo_total',
      'prioridad', 'estado', 'decision_origen']
  };
  const filas = (tabla, datos) => [COLUMNAS[tabla]].concat(datos.map(r => COLUMNAS[tabla].map(k => r[k])));

  return {
    COLUMNAS, proveedores, productos, ventas,
    valores: [
      { range: 'productos!A1', values: filas('productos', productos) },
      { range: 'ventas!A1', values: filas('ventas', ventas) },
      { range: 'proveedores!A1', values: filas('proveedores', proveedores) },
      { range: 'decisiones!A1', values: [COLUMNAS.decisiones] },
      { range: 'ordenes_compra!A1', values: [COLUMNAS.ordenes_compra] }
    ]
  };
}

module.exports = { generarDemo };
