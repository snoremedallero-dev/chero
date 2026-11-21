# Cipitío: El Despertar del Sombrerón

## Documento de diseño de juego — referencia de producción

**Convención de procedencia.** Las entradas marcadas **[Brief]** reproducen o parafrasean literalmente la propuesta original. Las marcadas **[Propuesta]** son decisiones de diseño añadidas para hacer el documento accionable; **no** deben leerse como parte del encargo original. Los nombres se conservan tal como aparecen en la propuesta.

**Créditos.** Jorge Galdamez — creador de Chero World y autor de esta propuesta de diseño. El prototipo integrado en el juego conserva sus nombres, jefes, mecánicas y tono.

## Estado del prototipo en Chero World

**[Propuesta]** El Capítulo 1 ya cuenta con un vertical slice jugable integrado en el juego existente. Se accede desde **Mapa → ⬢ Las Cenizas de Izalco · Cipitío**; el sector se monta en `(300, 0, 300)` con arena low poly, suelo físico y un HUD toon propio. La Siguanaba avisa, ataca, cambia a fase II al 50 % de vida y cae al llegar a cero.

**[Propuesta]** Los controles del slice son `V` parry, `X` disco de ceniza, `Z` salto a la huella invertida, `R` esquiva, `T` tónico y `J`/`K`/`M` para las formas Duende, Jaguar y Torogoz. Se usan teclas libres para no interferir con la hotbar ni con las acciones ya asignadas del juego base.

**[Propuesta]** La recompensa de la victoria es una hebra de la cabellera, `+150` colones y una unidad de progreso de misión. El estado (recursos, tónicos, huella y jefe vencido) se guarda en el campo `cipitio` de `chero_world_save`; reentrar al sector conserva el progreso y una muerte guardada se resuelve con `descansar()` antes de reactivar el combate.

---

## 1. Visión general

### 1.1 Premisa

**[Brief]** En un El Salvador mítico y devastado, el tejido entre el plano terrenal y el mundo de las leyendas —*El Inframundo de Mictlán / La Cuscatlán Ancestral*— se ha roto. Las sombras de la codicia y la deforestación han liberado al **Cadejo Negro**, alimentado por la violencia y el olvido de las tradiciones. El jugador encarna al **Cipitío**: no el niño de los cuentos, sino un guardián anciano atrapado en un cuerpo joven etéreo, poseedor de la magia de las cenizas y el cambio de forma. Porta su enorme sombrero de palma ancestral y un báculo de madera de bálsamo, y recorre Cuscatlán para restaurar el equilibrio y combatir deidades y mitos corruptos.

### 1.2 Tono narrativo

**[Brief]** Action-RPG / soulslike de mitología latinoamericana: solemnidad, peligro, duelo preciso y un trasfondo de pérdida.

**[Propuesta]** El tono se resume como **"duelo, no castigo"**: la dificultad debe sentirse como una conversación tensa con el mito, no como un muro. Cada derrota enseña una señal; cada victoria devuelve un fragmento de nombre, no solo experiencia. El dolor de los jefes es legible y merece respeto, nunca burla.

### 1.3 Temas centrales

- **[Propuesta, a partir del Brief] La tradición es una práctica, no un museo.** El Cipitío no "conserva" el folclore observándolo: lo ejecuta con el sombrero, el báculo y las huellas. Saber quién era alguien es una mecánica de supervivencia.
- **[Brief] El equilibrio roto.** La ruptura entre lo terrenal y lo legendario es la causa de la peste de sombras.
- **[Propuesta] La corrupción es exceso, no esencia.** Los jefes no son malvados por naturaleza: son formas sagradas deformadas por dolor, codicia o celo. Derrotarlos es devolverles su forma, no extinguirlos.
- **[Propuesta] Identidad desfasada.** Un guardián anciano en cuerpo joven: la experiencia está en los gestos, no en la edad. El sombrero y el báculo son los objetos que recuerdan por él.
- **[Brief] Violencia, olvido y deforestación** como combustible del Cadejo Negro.

### 1.4 Relación entre el Cipitío y las tradiciones que salva

**[Brief + Propuesta]** El Cipitío es el vínculo vivo entre la comunidad y sus mitos: cuando la gente deja de nombrar a la Dueña del Agua, al Cadejo Blanco o al Justo Juez, esas figuras se deforman y se vuelven depredadoras. El protagonista repara el vínculo dos veces: en la técnica (devolviendo a cada ser su patrón de combate "correcto") y en la memoria (recuperando los fragmentos del báculo).

**[Propuesta]** Sobre el título: *El Despertar del Sombrerón* se interpreta como un doble despertar —el del Cipitío tras siglos de letargo y el del antiguo portador del sombrero, cuyo rastro aparece al reparar el báculo—. Esta lectura no añade jefes ni altera el orden de los capítulos: solo da sentido al nombre del proyecto.

---

## 2. Resumen de la historia y arco de capítulos

**Resumen [Brief].** El Cipitío despierta en las entrañas del Volcán de Izalco tras siglos de letargo. Descubre que la Sihuamut ha roto el sello del volcán. Para restaurar el equilibrio repara su báculo sagrado, atraviesa los dominios de la Cuyancúa y del Justo Juez, y llega al corazón del bosque, donde el Cadejo Negro ha absorbido las gemas del sol y la luna ancestrales para erradicar a la humanidad.

**[Propuesta]** El arco se lee como un espiral: cada capítulo devuelve una parte del báculo y habilita una forma de movimiento que permite reinterpretar —no solo revisit— los anteriores.

### Capítulo 1 — Las Cenizas de Izalco (El Valle de las Sombras)

- **Ambientación [Brief]:** laderas volcánicas de lava petrificada, pueblos fantasma de bahareque y cañaverales encendidos; aire de azufre y ceniza.
- **Trama [Brief]:** el Cipitío despierta y halla roto el sello del volcán. La Sihuamut —la Ciguanaba en su forma corrupta y desenfrenada— enloqueció por la pérdida de su hijo y la maldad de los hombres.
- **Objetivo narrativo [Propuesta]:** entender que la ira de la Siguanaba es un luto mal dirigido; recuperar el primer fragmento del báculo de su cabellera.
- **Conexión [Propuesta]:** la ceniza adherida al báculo vibra hacia el agua; la pista conduce al Coatepeque.

### Capítulo 2 — El Suspiro del Coatepeque (El Dominio Fluido)

- **Ambientación [Brief]:** lago teñido de turquesa místico, vegetación tropical húmeda, ruinas sumergidas y cuevas de obsidiana.
- **Trama [Brief]:** el Cipitío busca el aliento de la Dueña del Agua para reparar su báculo, pero las aguas están infestadas por la Cuyancúa, antigua anunciadora de lluvias, ahora cegada por una maldición de barro y petróleo.
- **Objetivo narrativo [Propuesta]:** limpiar la maldición sin matar a quien anunciaba la lluvia; obtener el aliento que da voz al báculo.
- **Conexión [Propuesta]:** con la voz restaurada, el báculo oye el latigazo del Justo Juez a través de la bruma de Apaneca.

### Capítulo 3 — El Susurro de las Cortaderas (Los Cafetales de la Bruma)

- **Ambientación [Brief]:** fincas altísimas de la Cordillera de Apaneca, niebla espesa, árboles de sombra gigantescos y caminos de tierra roja.
- **Trama [Brief]:** el Cipitío busca a su hermano de causa, el Cadejo Blanco, pero el bosque está dominado por el Justo Juez de la Noche, espectro ecuestre convertido en tirano que juzga y ahorca a todo viajero.
- **Objetivo narrativo [Propuesta]:** liberar al Cadejo Blanco, descubrir que el Juez era un guardián degenerado por el exceso de celo, y tomar su látigo como vara del báculo.
- **Conexión [Propuesta]:** el Espíritu del Torogoz abre los desfiladeros del Imposible; el Cadejo Blanco señala la grieta donde duermen las gemas.

### Capítulo 4 — La Grieta del Imposible (El Corazón del Bosque)

- **Ambientación [Brief]:** Parque Nacional El Imposible, desfiladeros mortales, cascadas sagradas y árboles centenarios de bálsamo.
- **Trama [Brief]:** el Cipitío descubre el origen del mal: el Cadejo Negro absorbió el poder de las gemas del sol y la luna para erradicar a la humanidad. Debe superar las pruebas de los duendes de la cueva y derrotar al guardián del abismo, el Padre del Río, antes del enfrentamiento final.
- **Objetivo narrativo [Propuesta]:** completar el báculo con las gemas recuperadas y devolver su forma al Cadejo Negro, no solo vencerlo.
- **Cierre [Propuesta]:** el equilibrio no se restaura con una explosión, sino con el acto de nombrar de nuevo a cada figura; el sombrero queda plantado como un árbol de palma en la grieta.

---

## 3. Jefes: rol, fases, señales y vínculo mecánico

**[Propuesta]** Regla de lectura común: todo ataque peligroso tiene una **señal anticipada** visual y sonora; todo ataque señalizado puede responderse con parry, evasión o transformación. Las fases se anuncian, nunca aparecen sin aviso.

### 3.1 La Siguanaba, La Madre Traicionada

- **Rol narrativo [Brief]:** jefa de la zona de Izalco; criatura de torso imponente y cabellera negra como la noche, transformada en pesadilla ecuestre en su segunda fase.
- **Fase 1 — La cabellera [Propuesta]:** barridos en arco con la cabellera, zancadas de talón y lamentos que generan ondas en el suelo. El torso es resistente pero no blindado.
- **Fase 2 — La pesadilla ecuestre [Brief + Propuesta]:** mandíbula descoyuntada, embestidas de caballo espectral y pisotones con onda expansiva. El mordisco es la única acción que no se puede parry.
- **Señales de cambio [Propuesta]:** la cabellera pasa de negro a gris ceniza; los cascos suenan con un retardo artificial, como si el golpe llegara antes del sonido; la ocarina se desafina en un intervalo de segundo.
- **Parry y transformaciones [Propuesta]:** el barrido y las ondas se desvían con el sombrero; el disco de palma corta la cortina de cabello; el **Duende Saltarín** —obtenido de un minijefe de ceniza en Izalco— permite atravesar los pisotones. El **Nahual del Jaguar** aún no está disponible aquí, lo que hace que la fase 2 se resuelva con posicionamiento y huellas invertidas.

### 3.2 La Cuyancúa de las Profundidades

- **Rol narrativo [Brief]:** ser gigantesco, mitad serpiente y mitad cerdo, que anunciaba las lluvias y ahora destruye las riberas cegada por barro y petróleo.
- **Combate [Brief]:** plataformas flotantes y balsas; el monstruo altera el nivel del agua y genera tormentas eléctricas.
- **Fase 1 — La ribera [Propuesta]:** embestidas de hocico y coletazos que levantan olas bajas.
- **Fase 2 — La creciente [Propuesta]:** el agua sube y separa las plataformas; las olas se vuelven proyectiles parryables.
- **Fase 3 — La tormenta [Propuesta]:** relámpagos caen sobre las balsas y el barro se enciende en violeta; la Cuyancúa golpea desde fuera del campo con chorros de petróleo.
- **Señales de cambio [Propuesta]:** el turquesa del agua vira a violeta; la marimba sube un semitono y los tambores de cuero marcan un compás más lento justo antes del rayo.
- **Parry y transformaciones [Propuesta]:** las crecidas se desvían con el sombrero, que además funciona como planeador entre plataformas; el **Nahual del Jaguar** —obtenido antes, de un minijefe en las cuevas de obsidiana— rompe la placa de barro endurecido cuando la Cuyancúa emerge; las **huellas invertidas** sacan al jugador del remolino sin necesidad de saltar.

### 3.3 El Justo Juez de la Noche

- **Rol narrativo [Brief]:** espectro montado a caballo, corrompido en un tirano implacable que juzga y ahorca al viajero sin piedad.
- **Combate [Brief]:** duelo rápido, tipo hack-and-slash, de esgrima y látigo espectral bajo la bruma.
- **Fase 1 — El sable [Propuesta]:** estocadas cortas y contragolpes; exige parry en el último instante, no bloqueo prolongado.
- **Fase 2 — El látigo [Propuesta]:** el látigo espectral alcanza larga distancia y arrastra al jugador; el Juez se mueve dentro de la niebla.
- **Fase 3 — La caballería en la bruma [Propuesta]:** cargas del caballo, con el jinete inclinado y el sable atrasado.
- **Señales de cambio [Propuesta]:** la bruma se vuelve más densa y cálida; el chasquido del látigo cambia de tono; una linterna invisible proyecta una sombra roja antes de la carga.
- **Parry y transformaciones [Propuesta]:** estocada y látigo son parryables; el **Nahual del Jaguar** quiebra la armadura del caballo; el **Duende Saltarín** cruza la bruma; al caer el Juez se desbloquea el **Espíritu del Torogoz**.

### 3.4 El Cadejo Negro, La Sombra Furiosa

- **Rol narrativo [Brief]:** jefe final; ha absorbido el poder de las gemas del sol y la luna ancestrales para erradicar a la humanidad.
- **Fase 1 — El lobo infernal gigante [Brief + Propuesta]:** mordiscos, zancadas y sombras que se desprenden de su lomo. Los ojos brillan antes de cada embestida.
- **Fase 2 — Embalsamado en fuego rojo [Brief + Propuesta]:** estelas de fuego, resinas ardientes y zonas negadas; el fuego se desvía con el sombrero y se evade con huellas invertidas.
- **Fase 3 — Forma espectral colosal [Brief + Propuesta]:** altera la gravedad y el plano visual; el suelo se inclina y los puntos de referencia se invierten.
- **Señales de cambio [Propuesta]:** el aullido se convierte en un coro invertido; la llama pasa de rojo a violeta; antes de la tercera fase el cielo se refleja abajo.
- **Parry y transformaciones [Propuesta]:** el **Nahual del Jaguar** rompe la postura del lobo; el planeo del sombrero y el **Espíritu del Torogoz** sostienen el vuelo durante el vuelco gravitacional; el **Duende Saltarín** encadena las esquivas aéreas. El parry correcto en la fase 3 devuelve una gema al báculo y acorta la pelea.

### 3.5 Guardián y pruebas previas

- **Duendes de la cueva [Brief]:** pruebas de agilidad y observación en El Imposible. **[Propuesta]** No son un jefe de daño: enseñan a usar las huellas invertidas en espacios estrechos.
- **El Padre del Río [Brief]:** guardián del abismo. **[Propuesta]** Jefe de puerta: columnas de agua y golpes de cauce que sirven de ensayo de *timing* para el Cadejo Negro. Su recompensa es el último fragmento del báculo antes de las gemas.

---

## 4. Mecánicas principales

### 4.1 El Sombrero de Palma

**[Brief]** Escudo mágico para desviar proyectiles, planeador para cruzar barrancos y disco de lanzamiento a distancia.

**[Propuesta] Reglas de uso:**

- **Parry:** ventana de ~0,18 s desde que el sombrero se inclina. Desvía proyectiles y ataques señalizados; devuelve ceniza al medidor.
- **Planeo:** se mantiene mientras haya Aliento y haya altura; la velocidad baja al girar, lo que permite ajustar la caída.
- **Disco:** se lanza y regresa; mientras está fuera, el parry no está disponible. Es una decisión de riesgo/recompensa, no un ataque gratuito.
- **Límite:** no puede desviar lo que no tiene señal (los ataques marcados en violeta intenso); usar el disco contra esos ataques deja al jugador expuesto.

**[Propuesta] Interacción:** un parry exitoso recarga parcialmente las huellas invertidas y extiende la duración de la transformación activa. El sombrero es, por tanto, el eje que conecta las tres mecánicas.

### 4.2 Poder de la Ceniza y Huellas invertidas

**[Brief]** Transporte instantáneo a la posición de tus huellas, que miran en sentido contrario a donde caminas, para esquivar ataques pesados y confundir enemigos.

**[Propuesta] Reglas de uso:**

- El jugador deja una **huella activa** cada pocos segundos; su orientación es inversa a la dirección de marcha, así que el destino del teletransporte "engaña" la línea de ataque del enemigo.
- El salto consume **Ceniza** y tiene un rango máximo; no atraviesa paredes ni se usa durante agarrones.
- Tras aparecer, el enemigo pierde el objetivo durante un instante breve: es el *compás de desorientación* que hace única a esta mecánica.
- Solo existe una huella a la vez; recolocarla es gratis, teletransportarse no.

**[Propuesta] Interacción:** se puede invocar una huella durante el planeo del sombrero; el **Duende Saltarín** deja un rastro doble que amplía el radio de confusión.

### 4.3 Transformaciones

**[Brief]** Al estilo Rey Mono, tras derrotar jefes o minijefes: **Duende Saltarín** (ráfagas ágiles y esquivas rápidas), **Nahual del Jaguar** (golpes pesados que rompen posturas blindadas) y **Espíritu del Torogoz** (desplazamientos aéreos y proyectiles de plumas encendidas).

**[Propuesta] Reglas comunes:**

- Duración limitada (~20 s), medida en Ceniza; el medidor se vacía al atacar y se alarga con parries.
- No se pueden acumular; cambiar de forma cuesta un porcentaje del medidor.
- Al morir se pierde la forma, nunca la habilidad: se puede volver a invocar tras descansar.
- Los parries en forma de jaguar tienen menos ventana pero rompen postura; los del duende son más permisivos pero no dañan.

**[Propuesta] Interacción entre formas:** jaguar → duende encadena un golpe de postura con una esquiva; duende → torogoz convierte la última esquiva en impulso aéreo; torogoz → jaguar permite caer con un golpe pesado.

### 4.4 Modelo de recursos [Propuesta]

- **Salud:** se recupera con tónicos de bálsamo de carga limitada; se rellenan en los puntos de descanso.
- **Aliento:** sprint, esquivas y planeo; se regenera al estar quieto.
- **Ceniza:** disco, huellas y transformaciones; se recupera lentamente, con parries y al descansar.
- **Puntos de descanso [Propuesta]:** *Rescoldos de Ceniza*, hogueras de ceniza y resina de bálsamo. Al morir, la ceniza suelta queda en el lugar de la muerte y se recupera al volver a pisarlo.

---

## 5. Progresión del jugador

### 5.1 El báculo como hilo conductor

**[Brief]** La reparación del báculo sagrado es el hilo conductor; en el Capítulo 2 el Cipitío busca el aliento de la Dueña del Agua para repararlo.

**[Propuesta] Etapas de reparación:**

| Capítulo | Material recuperado | Habilidad que desbloquea |
| --- | --- | --- |
| 1. Las Cenizas de Izalco | Hebra de la cabellera de la Siguanaba | Disco de sombrero y ranura de ceniza |
| 2. El Suspiro del Coatepeque | Aliento de la Dueña del Agua | Voz del báculo: huellas persistentes más lejanas |
| 3. El Susurro de las Cortaderas | Látigo del Justo Juez | Segunda ranura de transformación |
| 4. La Grieta del Imposible | Gemas del sol y la luna | Parry de fase y forma colosal del Cipitío |

**[Propuesta]** El báculo cambia físicamente: madera de bálsamo sin tratar → resina sellada → varas espectrales → núcleo de gemas. Es el indicador visual del progreso incluso sin abrir menús.

### 5.2 Ritmo y desbloqueos

- **[Propuesta]** Ciclo de capítulo: exploración → minijefe → jefe → reparación del báculo → nueva forma de tránsito → revisita de una zona anterior con una ruta nueva.
- **[Propuesta]** Las transformaciones se desbloquean en este orden: Duende Saltarín (minijefe de ceniza en Izalco), Nahual del Jaguar (minijefe en las cuevas de obsidiana de Coatepeque, antes de la Cuyancúa) y Espíritu del Torogoz (al caer el Justo Juez en Apaneca). Cada una responde a una necesidad creada por el capítulo anterior y está disponible a tiempo para el jefe de su zona, tal como permite el brief al hablar de jefes *o minijefes*.
- **[Propuesta]** Dificultad: curva de tres tiempos —aprender el parry, combinarlo con las huellas, combinarlo con transformaciones— antes del Cadejo Negro.
- **[Propuesta]** Accesibilidad sin rebajar el reto: señales sonoras reforzadas con subtítulos direccionales, opción de ampliar el periodo de anticipación visual y opción de reducir sacudida de cámara. El daño no cambia.

---

## 6. Dirección de arte y audio

### 6.1 Arte

**[Brief]** Estilo semirrealista con texturas orgánicas: madera tallada, barros cocidos, vegetación tropical, templos pipiles cubiertos de musgo, partículas doradas y violetas para la magia ancestral.

**[Propuesta] Materiales dominantes por capítulo:**

- **Izalco:** lava petrificada, bahareque agrietado, caña chamuscada, ceniza acumulada en grietas.
- **Coatepeque:** obsidiana pulida, piedra sumergida, hojas húmedas de gran formato, resina y turquesa.
- **Apaneca:** tierra roja, sombra de los cafetales, bruma lechosa, madera de árboles de sombra.
- **El Imposible:** bálsamo centenario, caliza húmeda, musgo, cascadas y vetas de oro/violeta en la grieta.

**[Propuesta] Paletas:** ámbar y negro obsidiana en Izalco; turquesa y verde selva con violeta eléctrico en Coatepeque; gris perla y terracota en Apaneca; dorado ancestral y violeta profundo en El Imposible. El color de la magia se codifica: **dorado cálido = ceniza del Cipitío**, **violeta frío = corrupción hostil**. Nunca ambos en la misma silueta.

**[Propuesta] Siluetas:** el sombrero es el reconocimiento visual del jugador incluso contra el cielo; cada jefe tiene una silueta única en reposo (cabellera, hocico, látigo, lomo).

### 6.2 Audio

**[Brief]** Instrumentación tradicional —ocarinas de barro, tambores de cuero, marimba, flautas de caña— mezclada con orquestación épica y guitarras pesadas en los jefes principales.

**[Propuesta] Color por capítulo:**

- **Izalco:** ocarina de barro y tambor de cuero grave; la ceniza suena como arena frotada.
- **Coatepeque:** marimba y flauta de caña con percusión de agua; la tormenta añade cuerdas eléctricas.
- **Apaneca:** flauta de caña en registro alto y latigazo percutivo; la bruma amortigua los agudos.
- **El Imposible:** marimba invertida, coro y guitarras pesadas; el Cadejo Negro usa un motivo que se reproduce al revés en su fase final.

**[Propuesta] Transiciones:** el cambio de fase se anuncia con un *corte* instrumental —un compás de silencio— antes de introducir el nuevo timbre. El resultado es que el jugador oye el cambio antes de verlo, y puede preparar el parry.

**[Propuesta] Motivo del báculo:** cada fragmento reparado añade una nota al tema del Cipitío; al repararse por completo, las cuatro notas suenan juntas en el duelo final.

---

## 7. Glosario folclórico breve

- **Cipitío [Brief]:** en la tradición salvadoreña, un ser infantil vinculado a la Cihuanaba y al Sombrerón, eternamente joven y de sombrero grande. La propuesta lo reinterpreta como guardián anciano en cuerpo etéreo; esa inversión es parte del brief, no un error de documentación.
- **Sihuamut / Ciguanaba / Siguanaba [Brief]:** la figura femenina que cambia de apariencia y aparece junto al agua; suele describirse como una mujer atractiva cuyo rostro se revela monstruoso. El nombre *Sihuamut* se conserva para la forma corrupta; *La Siguanaba, La Madre Traicionada* para el jefe.
- **Cuyancúa [Brief]:** en el folclore salvadoreño, un animal fabuloso mitad serpiente y mitad cerdo cuyo hocico anuncia la lluvia. **[Propuesta]** Sus rasgos de barro y petróleo son una contaminación del relato, no una descripción tradicional.
- **Cadejo [Brief]:** espíritu canino de ojos luminosos, extendido en Centroamérica y México; el **Cadejo Blanco** protege al viajero y el **Cadejo Negro** lo acecha. El Cadejo Blanco aparece como hermano de causa del Cipitío.
- **Justo Juez de la Noche [Brief]:** jinete espectral de la tradición oral centroamericana que recorre la noche y dicta sentencia. **[Propuesta]** Su ahorcamiento se trata como imagen de terror folclórico, no como castigo ejemplarizante.
- **Dueña del Agua [Brief]:** **[Propuesta]** denominación respetuosa para la posesión ancestral del lago; se trata como una deidad local, no como un recurso extraíble.
- **Padre del Río [Brief]:** **[Propuesta]** figura creada para la propuesta como guardián del abismo, coherente con la tradición de espíritus de agua y cauce.
- **Mictlán / Cuscatlán Ancestral [Brief]:** *Mictlán* es el inframundo de la tradición nahua; *Cuscatlán* es el nombre náhuatl de El Salvador. **[Propuesta]** El documento los mantiene como dos planos en tensión, sin fundirlos en una sola mitología.
- **Nahual [Brief]:** persona capaz de transformarse en animal en la tradición mesoamericana; de ahí toma nombre la forma del jaguar.
- **Torogoz [Brief]:** el motmot de ceja turquesa, ave nacional de El Salvador, asociada en la cultura popular con el cuidado de los árboles.
- **Duendes de la cueva [Brief]:** seres pequeños de las cuevas del Imposible; en la propuesta cumplen la función de prueba, no de antagonistas.
- **El Sombrerón [Propuesta]:** figura folclórica de hombre alto con sombrero ancho que corteja y trenza el cabello; aquí solo se alude a él en el título y en el rastro del sombrero, sin convertirlo en jefe.

---

## 8. Riesgos de diseño y mitigación

| Riesgo | Por qué importa | Mitigación propuesta |
| --- | --- | --- |
| **Dificultad soulslike** | Puede volver el juego hostil y abandonar a jugadores que quieren la historia. | Rescoldos densos, pérdida recuperable de ceniza, señales ampliables y un "modo lectura" que solo cambia la claridad, nunca el daño. |
| **Claridad de la magia de ceniza** | Dorado y violeta pueden confundirse con ataques hostiles en pantallas cargadas. | Codificación estricta de color, partículas con silueta estable, audio direccional para el parry y límite de partículas simultáneas. |
| **Sensibilidad cultural** | Mitos vivos pueden presentarse como "malos" o como mercancía estética. | Nombrar siempre a cada ser con respeto; distinguir forma original de forma corrupta; revisar textos con cultores y practicantes; evitar mezclar Mictlán y Cuscatlán como si fueran el mismo panteón. |
| **Tratamiento del ahorcamiento y el luto** | El Justo Juez y la Siguanaba manejan imágenes sensibles. | Representarlos como metáforas visuales, sin instrucciones ni detalles gráficos; incluir aviso de contenido al iniciar el Capítulo 3. |
| **Promesa del título sin recompensa narrativa** | *El Despertar del Sombrerón* podría leerse como un jefe que nunca aparece. | Cerrar el arco con el rastro del antiguo portador en el báculo y una escena final breve; mantener al Sombrerón fuera del combate para no alterar la lista de jefes del brief. |
| **Complejidad de tres sistemas a la vez** | Sombrero, huellas y transformaciones pueden competir por la atención. | Introducirlos uno por capítulo; el primer jefe usa solo sombrero y duende, el segundo añade huellas, el tercero consolida la transformación pesada. |

---

## 9. Cierre de producción

**[Propuesta]** El documento es una referencia de diseño, no una implementación. Cada decisión marcada como propuesta puede revisarse sin tocar la premisa, los nombres, los jefes, las mecánicas ni el tono del brief original. La meta de producción es que un equipo pueda responder, sin preguntar: *qué se siente, qué se ve, qué se oye y qué se hace* en cada enfrentamiento.
