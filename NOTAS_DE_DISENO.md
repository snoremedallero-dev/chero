# Notas de diseño (decisiones breves)

- **Identidad visual**: se adopta “Chero World” (pizarra verde agua, coral, arena y ámbar; formas octogonales/diamantadas y tipografía Avenir/Segoe). Se conserva la API de los módulos gráficos (`createStudTexture`, `AvatarR6`, `MiniMap`) para no reescribir sus consumidores: solo cambia lo que dibujan. El acabado es cel-shading/toon en 3D y en interfaz.
- **Carrera**: `Shift` en PC y el botón “CORRER” en móvil. Velocidad 24 vs. 16, drenaje 26 pts/s, regeneración 18 pts/s tras 0.6 s y exigencia de recuperar 15 pts tras agotarse. Se eligió ese umbral para evitar alternar velocidad cada frame al mantener la tecla.
- **Persistencia**: se reutiliza `DataStore` (ahora con clave `chero_world_save` y migración de la anterior). Los bloques se guardan con retardo de 300 ms y se validan al restaurar (máximo 300, coordenadas acotadas) porque provienen de `localStorage`. Además de progreso, monedas, skins, misiones, cámara y mundo, se guardan posición, salud, energía, hora del ciclo, audio, herramienta activa y visibilidad del panel de controles; todo se sanea al cargar. Hay guardado automático cada 10 s y en `beforeunload`. `reset()` borra también la clave legacy para que no reaparezcan misiones o skins antiguas.
- **Ciclo día/noche**: se conectó `DayNightCycle` que ya existía sin uso; se mantuvo el período inicial en “día” para no alterar la visibilidad del spawn.
- **Retícula/estado de construcción**: se muestra información, no cambia el raycast ni el alcance. Es útil para saber si el bloque fantasma está en rango.
- **Servidor**: `npm run server` ya arranca `server/index.js` (Express + Socket.io en el puerto `3001` o `PORT`). Sirve `dist/`, expone `/health` y mantiene un estado canónico de bloques por sala. El cliente detecta `/health` antes de conectar: con `npm run dev` sigue funcionando en solitario y no intenta abrir Socket.io contra Vite.
- **Economía**: cartera con colones y bitcoins, tasa fija de `1 ₿ = 100 ◆` y conversión en bloques enteros desde el panel. Se eligió una tasa simple para que el HUD sea legible y las pruebas deterministas.
- **Misiones**: Cipitio (recoger colones), La Cihuanaba (distancia) y El Sisimite (puntos de control). Se aceptan al hablar con `[Q]` y la recompensa se reclama hablando de nuevo; así el NPC tiene un papel activo. Solo progresan mientras están aceptadas y entregan skin + bitcoins una sola vez.
- **Skins/sprites**: catálogo con 100 entradas: 5 iniciales, 3 de leyenda, 87 de metas y 5 de tienda. `AvatarR6.setSkin` recicla materiales y regenera solo la textura facial; no se tocan geometrías ni animación.
- **Interacción**: `E` sigue recogiendo objetos; `Q` (o el botón táctil “HABLAR”) habla con leyendas y tiene prioridad visual en el cartel de ayuda. `B` / botón “SKINS” abre el inventario.
- **Gráficas nuevas**: los NPCs son figuras geométricas facetadas (cono/icosaedro/octaedro) con pedestal octogonal, y el panel de skins usa los mismos tokens `--cw-*` y recortes biselados que el resto de la interfaz. No se introdujeron emojis: se usan glifos ◈ △ ◇ ⬡ ◆ ₿. Los emojis heredados que aparecían en prompts/toasts (`🫓`, `🟢`) y en etiquetas se sustituyeron por `◇` y `◆`.

## Estilo cel-shading

- **Rampa central**: `ToonStyle.js` crea una única `DataTexture` de 3 tonos (72/168/255) con `NearestFilter`. Todas las mallas comparten esa rampa, así que la luz pasa de sombra a media luz a luz sin degradados. Es la decisión más simple y evita una textura por material.
- **Materiales**: se sustituyeron las fábricas locales de `MeshStandardMaterial` por `createToonMaterial` en avatar, bloques, baseplate, NPCs, nivel Obby, SalvadorWorld, pesca, mina y mobiliario urbano. El helper conserva color, mapa, emisivo y transparencia; ignora `roughness` y `metalness` porque `MeshToonMaterial` no los usa, anula `bumpScale` para no suavizar los tonos y activa `flatShading` como propiedad para lograr caras planas low poly. No se reescribió la lógica de ningún mundo.
- **Contorno**: `OutlineEffect` se aplica una sola vez en `Engine` con grosor `0.008` y color tinta verde oscuro. La vista previa de construcción se excluye porque ya tiene aristas propias. Se eligió un contorno global en vez de mallas invertidas por bloque para no multiplicar objetos ni tocar el raycast.
- **Renderer y luz**: se desactivó el mapeo tonal ACES (`NoToneMapping`) y se cambiaron las sombras suaves por `PCFShadowMap`. Se bajó la luz ambiental y se ajustaron las intensidades de `DayNightCycle` para que los 3 tonos sigan distinguiéndose; el ciclo, los colores del cielo y el comportamiento siguen iguales.
- **Texturas y UI**: el mosaico de `StudTexture` ahora usa dos caras planas y filtro `Nearest`. En `style.css` se eliminaron todos los degradados y desenfoques: botones y barras son rellenos planos, y las sombras difusas pasaron a desplazamientos duros de 3–8 px. El minimapa usa colores sólidos y bordes gruesos. La paleta existente (`--cw-*`) no cambió; solo se simplificó su aplicación.
- **Funcionalidades ya presentes**: skins por misión y compra en colones/bitcoins, selector de cámaras y los mundos de pesca/mina ya estaban implementados y se conservaron. El trabajo de esta entrega fue envolverlos en el mismo estilo toon sin duplicar sistemas.

## Referencia low poly (POLYGON City Pack)

- **Interpretación**: se tomó el referente visual como estilo, no como assets copiados: geometría de pocas caras, normales facetados, colores saturados, sombras marcadas y mobiliario urbano modular. El cel-shading existente se conservó; `flatShading` refuerza las caras planas.
- **Geometría**: se bajaron los segmentos de cilindros, conos y esferas de comales, pupusas, ruedas, monedas, trofeos y cocos (de 12–20 a 6–8 lados, o icosaedros de nivel 0). Los bloques y edificios ya eran cajas, así que no cambiaron.
- **Mobiliario nuevo**: `CityProps.js` añade un taxi amarillo, una patrulla blanca/azul con letreros `TAXI`/`POLICE`, hidrantes, semáforos, árboles angulares y bancas en el Parque Central. No tienen colisionadores nuevos para no alterar movimiento, pesca, mina ni construcción.
- **Letreros**: las etiquetas son texturas de canvas con relleno plano, borde grueso y filtro `Nearest`, coherentes con el minimapa y la UI. Se usan las palabras del referente, sin emojis.
- **Decisión simple**: se mantuvo la paleta Chero y se redujo solo la densidad geométrica; no se importaron modelos externos ni se cambiaron las físicas.

## Controles bajo demanda

- El topbar solo muestra el botón “▣ Controles”. El panel con las instrucciones tiene `hidden` en el HTML y se abre con clic, con `H` o con el botón táctil habilitado desde el HUD; se cierra al volver a pulsar, con `H` o al hacer clic fuera.
- El estado de apertura se persiste en `DataStore` para que no aparezca de improvisado tras recargar si el jugador lo había ocultado.

## Nombre y pantalla inicial

- **Renombrado**: el paquete pasó a `antigravity-chero-game`, la clave de guardado legacy a `antigravity_chero_save` y se sustituyeron todas las menciones visibles/documentales de la marca anterior por “Chero”. La clave principal sigue siendo `chero_world_save` para no perder partidas ya migradas.
- **Reparto de sprites**: `SkinCatalog.js` mantiene las API antiguas (`SKINS`, `getSkin`) y añade alias (`SPRITES`, `getSprite`). Hay 100 sprites: 5 iniciales, 3 recompensas de leyenda, 87 de metas y 5 comprables. Por eso la pantalla muestra 95 bloqueados al empezar.
- **Desbloqueos**: `SpriteProgress.js` acumula 7 contadores (colones, distancia, checkpoints, pesca, mina, construcción y misiones de leyenda). Cuando se cruza un umbral se entrega el sprite, se avisa una vez y se guarda; los sprites ya poseídos se marcan al cargar para no repetir avisos. Las conversiones de moneda no cuentan como “colones recogidos”.
- **Pantalla inicial**: `StartScreen.js` muestra las 100 tarjetas, deshabilita las bloqueadas y escribe en cada una su meta y progreso (`0/50 · Recoge 50 colones`). El sprite elegido se equipa de inmediato; el bucle de juego queda congelado hasta pulsar “ENTRAR AL MUNDO”. El botón “✦ Sprites” del topbar permite reabrir el selector.
- **Gráficas nuevas**: la pantalla usa la misma pizarra verde agua, corales, ámbar y recortes octogonales que el HUD; rejilla de 10 columnas (5 en tablet, 4 en móvil) y glifos geométricos en lugar de emojis.

## Cámaras

- **Selector desacoplado**: `CameraModes.js` es un catálogo declarativo; `ThirdPersonCamera.setMode/cycleMode` solo aplica distancia, inclinación, FOV y suavizado. Añadir un modo no requiere tocar `PlayerController`, `TouchControls`, `MiniMap` ni `BuildingController`.
- **Modos**: TPS orbital (default), TPS cercana, FPS y cenital. `KeyC` y el botón táctil “CÁMARA” ciclan; el menú del topbar elige directamente. En FPS se oculta el avatar y se usa `eyeHeight` para no ver el cuerpo desde dentro.
- **Compatibilidad**: se conserva la fachada `cameraController` (`yaw`, `pitch`, `distance`, `minPitch`, `maxPitch`, `getHorizontalForward`, `getHorizontalRight`, `update`) y la referencia original de `engine.camera`.
- **Persistencia**: `cameraMode` y `worldId` se guardan en `DataStore` y se saneen con `getCameraMode` al cargar.

## Mundos de pesca y mina

- **Aditivos**: `FishingWorld.js` y `CoinMineWorld.js` construyen su propio `THREE.Group` con suelo/colisionadores, igual que `SalvadorWorld` y `ObbyLevel`. No se recargan escenas ni se reescriben los mundos existentes.
- **Pesca**: Lago de Güija (+25 colones), Lago de Coatepeque (+30) y Río Lempa (+20). Se pesca con `KeyG` o el botón táctil “PESCA” cuando el prompt lo indica; hay cooldown de 1.5 s para evitar farmeo por spam.
- **Mina** (`-150, 0, -120`): 6 vetas que se recogen por proximidad y se reponen a los 8 s. Las vetas 0/3 entregan 1 ₿ y el resto 20 colones; así ambos recursos alimentan la cartera sin conversiones forzadas.
- **Integración**: las recompensas pasan por `Wallet`, actualizan HUD/panel de skins, registran progreso en la misión de colones, suenan con `playCoin()` y se guardan con el retardo existente. Los prompts priorizan leyendas → pesca → mina → objetos recogibles.
- **Viaje rápido y minimapa**: el menú “MUNDOS Y RUTAS” incluye los 4 destinos nuevos con `data-world`, y sus marcadores se inyectan en `miniMap.landmarks` con las mismas formas/corales del resto. El z-index del minimapa bajó a 25 para no tapar modales.

## Servidor y sesión compartida

- **Estado canónico**: cada sala guarda sus bloques en el servidor (máximo 300) y los entrega en `world:state` a quien entra. Los eventos son `world:join`, `player:state`, `block:place` y `block:remove`; el servidor acota coordenadas, tamaños y ángulos con `src/net/protocol.js`, el mismo módulo que sanea el cliente.
- **Bloques**: `BlockManager` acepta un `id` canónico opcional, expone `hasBlock`/`removeBlockById` y serializa ese id. Los cambios remotos entran con `silent` para no rebotar ni sonar, y los bloques locales se comparten al conectarse.
- **Jugadores**: `RemotePlayers` crea un `AvatarR6` por jugador ajeno, interpola posición con suavizado exponencial y giro por el camino corto (`lerpAngle`), y aplica la skin recibida. No hay cuerpos físicos remotos: es solo representación visual.
- **Frecuencia**: el transform local se envía a 20 Hz; el servidor vuelve a limitar a 50 ms por jugador para no saturar la sala.
- **Modo solitario**: si `/health` no responde con `server: "chero-world"`, `NetworkClient.connect()` devuelve `false` y el juego continúa sin avisos. Socket.io-client se importa de forma dinámica y queda en un chunk aparte.

## Construcción en mundos nuevos

- `FishingWorld.getBuildSurfaces()` y `CoinMineWorld.getBuildSurfaces()` entregan sus suelos al `BuildingController` como superficies adicionales de raycast. La rejilla y el alcance no cambian porque esos suelos tienen la cara superior en `Y = 0`, igual que el baseplate.
- El modo demoler solo elimina mallas que estén en `blockManager.getInteractableMeshes()`, nunca baseplate ni suelos de pesca/mina.

## Créditos

- **Jorge Galdamez** es el creador del proyecto: define la identidad Chero World, la adaptación del mito del Cipitío y las decisiones recogidas en `CIPITIO_GDD.md` y en este documento.
- La sección dentro del juego reutiliza los tokens `--cw-*`, el recorte octogonal de `.game-panel` y glifos geométricos (`◈ ◇ ◆ ⬢ ✦`), sin emojis ni degradados.
- Se abre desde el botón “✦ Creador” del topbar, desde el botón “✦ Creador” de la pantalla inicial o con `Y`; se cierra con `✕`, con `Y` o al hacer clic fuera. No guarda estado: es información, no progreso, y no interfiere con `H` (controles) ni con los atajos del Cipitío.

## Revisión y pendientes

- `npm test`: 83/83 pruebas (incluyen cámara, selector HUD, pesca, mina, persistencia ampliada, 100 sprites, umbrales de desbloqueo, pantalla inicial, controles ocultos, mobiliario low poly, protocolo de red, cliente/servidor Socket.io, avatares remotos, superficies de construcción, ausencia de emojis, estilo toon y el prototipo del Cipitío). `npm run build`: correcto; permanece el aviso de chunk >500 kB por Three.js (el cliente de Socket.io ya sale en un chunk separado).
- Revisión manual recomendada: probar el cambio FPS↔TPS en móvil, el desborde del topbar en pantallas ≤768 px con el panel de controles abierto, la rejilla de 100 sprites en pantallas pequeñas, el equilibrio de recompensas de la mina, el rendimiento del pase de contorno en dispositivos débiles y una sesión con dos pestañas para confirmar la interpolación de avatares.
- La pantalla inicial aparece en cada carga (incluso con partida guardada) para que el cambio de sprite sea siempre visible; si se prefiere mostrarla solo la primera vez, basta con condicionar `startScreen.open(false)` con un flag en `DataStore`.

## Prototipo jugable del Capítulo 1

- El viaje rápido incluye **⬢ Las Cenizas de Izalco · Cipitío** (`data-world="izalco"`). Al entrar se monta un sector autocontenido en `(300, 0, 300)` con arena, suelo físico propio y HUD toon; al salir se retiran mallas, suelo e interfaz.
- `src/cipitio/CipitioController.js` conecta la lógica pura (`CipitioState`, `Siguanaba`) con los visuales y el `PlayerController` existente mediante callbacks: no duplica daño ni modifica el movimiento base.
- Controles del prototipo: `V` parry, `X` disco, `Z` salto a la huella invertida, `R` esquiva, `T` tónico y `J`/`K`/`M` para Duende/Jaguar/Torogoz. Se eligieron teclas libres para no pisar `Q`, `E`, `F`, `H`, `C`, `G`, `B` ni la hotbar `1`–`6`.
- El progreso se guarda en `cipitio` dentro de `chero_world_save`: recursos, tónicos, huella y si la Siguanaba ya fue vencida. Reentrar al sector conserva ese estado; si el guardado se interrumpió con vida en cero, se reaplica `descansar()` antes de activar.
- La victoria entrega una hebra de la cabellera, `+150` colones y progreso de misión una sola vez. La recompensa queda marcada como entregada en el guardado.
- `CIPITIO_GDD.md` es la referencia de diseño completa (visión, capítulos, jefes por fases, mecánicas, progresión, arte/audio, glosario folclórico y riesgos) y ahora también registra el estado del vertical slice implementado. Distingue con `[Brief]` y `[Propuesta]` qué viene del encargo y qué se añadió.
