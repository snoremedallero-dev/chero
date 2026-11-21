# Chero World

Juego 3D salvadoreño de construcción y aventura con estética toon/low poly, mundo compartido por Socket.io y un prototipo jugable del Capítulo 1 de *Cipitío: El Despertar del Sombrerón*.

## Requisitos

- Node.js 18 o superior.

## Puesta en marcha

```bash
npm install
npm run dev
```

Vite sirve el cliente en `http://localhost:5173`. En modo desarrollo el cliente de red queda inactivo si no detecta el servidor; esto es intencional.

## Servidor compartido

```bash
npm run build
npm run server
```

El servidor Express + Socket.io escucha en `http://localhost:3001` (o en `PORT`) y sirve la carpeta `dist/`. Expone `/health` y mantiene los bloques por sala.

## Pruebas

```bash
npm test
npm run build
```

## Controles principales

- `W/A/S/D` moverse, `Espacio` saltar, `Shift` correr.
- `Q` hablar con leyendas, `E` recoger/soltar, `F` usar objeto, `G` pescar/minar.
- `C` cámara, `B` skins, `H` ayuda de controles, `Y` créditos del creador, `1`–`6` hotbar de construcción.

## Prototipo del Cipitío

En el mapa rápido, entrar a **⬢ Las Cenizas de Izalco · Cipitío**. Controles del combate:

- `V` parry con el sombrero, `X` disco de ceniza, `Z` salto a la huella invertida.
- `R` esquiva, `T` tónico.
- `J` Duende, `K` Jaguar, `M` Torogoz.

La victoria contra La Siguanaba entrega una hebra de la cabellera y `+150` colones. El progreso se guarda en `localStorage` bajo `chero_world_save`.

## Créditos

**Creador: Jorge Galdamez.** Autor de la idea, el diseño y la implementación de Chero World, incluido el prototipo jugable del Capítulo 1 de *Cipitío: El Despertar del Sombrerón* y su documento de diseño (`CIPITIO_GDD.md`).

La sección también está dentro del juego: abre **✦ Creador** en la barra superior, pulsa `Y` o usa el botón **✦ Creador** de la pantalla inicial.

## Despliegue gratuito en Render

El repo incluye `render.yaml`, un Blueprint listo para Render:

1. Entra a https://dashboard.render.com y elige **New → Blueprint**.
2. Conecta el repositorio `snoremedallero-dev/chero`.
3. Render detectará `render.yaml` y creará el servicio `chero-world`.
4. El build ejecuta `npm ci && npm run build` y el arranque `node server/index.js`.
5. La URL pública servirá a la vez el cliente y Socket.io; `/health` es el health check.

El plan **Free** no requiere tarjeta. Limitaciones a tener en cuenta: el servicio se apaga tras 15 min sin tráfico y tarda ~1 min en despertar, y el estado de salas en memoria se reinicia al reiniciar el proceso. El progreso del jugador sigue en `localStorage`, así que no se pierde.

## Documentación

- `NOTAS_DE_DISENO.md`: decisiones técnicas y de implementación.
- `CIPITIO_GDD.md`: documento de diseño del prototipo del Cipitío.
