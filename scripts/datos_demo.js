// Vista previa local de los datos de demo y de las metricas que calculara n8n.
// Uso: node herramientas/datos_demo.js [AAAA-MM-DD]   (por defecto, hoy)

const { generarDemo } = require('../src/generador_demo');

const HOY = process.argv[2] || new Date().toISOString().slice(0, 10);
const { proveedores, productos, ventas } = generarDemo(HOY);

function metricas(p) {
  const prov = proveedores.find(x => x.proveedor === p.proveedor);
  const serie = ventas.filter(v => v.sku === p.sku).map(v => v.unidades);
  const suma = a => a.reduce((s, x) => s + x, 0);
  const v7 = suma(serie.slice(-7)) / 7;
  const vPrev = suma(serie.slice(0, 21)) / 21;
  const mediana = [...serie].sort((a, b) => a - b)[Math.floor(serie.length / 2)];
  let ceros = 0; for (let i = serie.length - 1; i >= 0 && serie[i] === 0; i--) ceros++;
  const disponible = p.stock_actual - p.pedidos_clientes_pendientes;
  return {
    sku: p.sku,
    v7: +v7.toFixed(2), vPrev21: +vPrev.toFixed(2),
    tendencia_pct: vPrev > 0 ? Math.round((v7 - vPrev) / vPrev * 100) : null,
    disponible,
    cobertura_dias: v7 > 0 ? +(disponible / v7).toFixed(1) : null,
    reposicion: prov.tiempo_reposicion_dias,
    pico_vs_mediana: mediana > 0 ? +(Math.max(...serie) / mediana).toFixed(1) : null,
    dias_sin_venta: ceros,
    capital_en_stock: +(Math.max(0, p.stock_actual) * p.costo_unitario).toFixed(2)
  };
}

console.log('HOY =', HOY);
console.table(productos.map(metricas));
console.log('ventas:', ventas.length, 'filas, de', ventas[0].fecha, 'a', ventas[ventas.length - 1].fecha);
