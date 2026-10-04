# Cómo aportar a Decide Inventario

Es el Proyecto #01 de [Taller Pyme](https://github.com/naty2830/taller_pyme). Lee también la guía general de la iniciativa.

## Lo más útil ahora

1. **Seguir [docs/INSTALACION.md](docs/INSTALACION.md) desde cero** y reportar cada paso donde te atoraste.
2. Corregir textos confusos.
3. Casos de ejemplo nuevos (datos **ficticios**) que muestren otra situación de inventario.
4. Ideas del [ROADMAP](ROADMAP.md).

## Reglas para cambios de código

- La lógica vive en `src/logica_inventario.js`. Los flujos de n8n usan **la misma** lógica copiada tal cual: si cambias una, cambia la otra.
- Sin dependencias de npm, salvo razón fuerte.
- Corre `npm test` antes de enviar. Si arreglas un error, agrega una prueba.
- Si una prueba falla, sospecha primero de la prueba (que el texto o el número esperado sea correcto) antes de tocar el código.
- Nada de llaves, IDs personales ni datos reales en los commits.

## Cómo enviar

Fork, rama y pull request con: qué cambia, por qué y cómo lo probaste.
