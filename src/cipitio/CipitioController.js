import * as CANNON from 'cannon-es';
import { CipitioArena } from './CipitioArena.js';
import { CipitioHUD } from './CipitioHUD.js';
import { CipitioState } from './CipitioState.js';
import { CipitioVisuals } from './CipitioVisuals.js';
import { Siguanaba } from './Siguanaba.js';
import { SOMBRERO } from './constants.js';

const sumar = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const restar = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

const MENSAJES = {
  'parry:exito': '◈ Parry perfecto: la Siguanaba se desarma',
  'jefe:fase2': '△ Fase II: la pesadilla ecuestre despierta',
  'jefe:derrotado': '✦ La Siguanaba recupera su forma',
  'transformacion:inicio': '⬢ Transformación activada',
  muerte: '◇ El Cipitío cae: vuelve al Rescoldo de Ceniza'
};

/**
 * Orquesta el prototipo del Capítulo 1 dentro del juego existente.
 * No modifica PlayerController: recibe la posición del jugador por callbacks y
 * solo notifica vida/teletransporte para que main.js decida cómo aplicarlos.
 */
export class CipitioController {
  constructor({
    scene,
    physicsWorld = null,
    origen = { x: 0, y: 0, z: 0 },
    obtenerPosicion = () => ({ x: 0, y: 0, z: 0 }),
    obtenerOrientacion = () => 0,
    estaMoviendose = () => false,
    sincronizarVida = () => {},
    teletransportar = () => {},
    reproducirSonido = () => {},
    onEvento = () => {},
    onVictoria = () => {},
    crearHUD = true
  } = {}) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.sueloCuerpo = null;
    this.origen = { ...origen };
    this.obtenerPosicion = obtenerPosicion;
    this.obtenerOrientacion = obtenerOrientacion;
    this.estaMoviendose = estaMoviendose;
    this.sincronizarVida = sincronizarVida;
    this.teletransportar = teletransportar;
    this.reproducirSonido = reproducirSonido;
    this.onEvento = onEvento;
    this.onVictoria = onVictoria;
    this.activo = false;
    this.planeando = false;
    this.recompensaEntregada = false;

    this.arena = new CipitioArena();
    this.arena.grupo.position.set(this.origen.x, this.origen.y, this.origen.z);
    this.visuals = new CipitioVisuals(this.arena.grupo);
    this.visuals.setJefaVisible(false);

    const emitir = (tipo, datos) => this.emitir(tipo, datos);
    this.estado = new CipitioState({ onEvent: emitir });
    this.jefe = new Siguanaba({ onEvent: emitir });
    this.hud = crearHUD ? new CipitioHUD({ onAccion: (accion) => this.ejecutarAccion(accion) }) : null;
  }

  emitir(tipo, datos) {
    this.reproducirSonido(tipo, datos);
    this.onEvento(tipo, datos);
    const mensaje = MENSAJES[tipo];
    if (mensaje) this.hud?.avisar(typeof mensaje === 'function' ? mensaje(datos) : mensaje);
  }

  activar({ reiniciar = false } = {}) {
    if (!this.scene || this.activo) return false;
    this.scene.add(this.arena.grupo);
    this.crearSueloFisico();
    if (reiniciar) {
      this.estado.reset();
      this.jefe.reset();
      this.recompensaEntregada = false;
    } else if (this.estado.derrotado) {
      // Un guardado interrumpido tras la muerte no debe dejar al jugador sin vida.
      this.estado.descansar();
    }
    this.visuals.setJefaVisible(!this.jefe.derrotada);
    const jefeLocal = this.arena.getPuntoJefa();
    this.jefe.iniciar(jefeLocal);
    this.sincronizarVida(this.estado.vida);
    this.teletransportar(sumar(this.origen, this.arena.getPuntoEntrada()));
    this.hud?.setVisible(true);
    this.activo = true;
    this.emitir('sector:entrar');
    return true;
  }

  desactivar() {
    if (!this.activo) return false;
    this.activo = false;
    this.hud?.setVisible(false);
    this.visuals.setJefaVisible(false);
    this.scene.remove(this.arena.grupo);
    this.retirarSueloFisico();
    this.emitir('sector:salir');
    return true;
  }

  crearSueloFisico() {
    if (!this.physicsWorld || this.sueloCuerpo) return;
    const cuerpo = new CANNON.Body({ mass: 0, material: this.physicsWorld.groundMaterial });
    cuerpo.addShape(new CANNON.Cylinder(26, 26, 1, 12));
    cuerpo.position.set(this.origen.x, this.origen.y - 0.5, this.origen.z);
    this.physicsWorld.addBody(cuerpo);
    this.sueloCuerpo = cuerpo;
  }

  retirarSueloFisico() {
    if (!this.physicsWorld || !this.sueloCuerpo) return;
    this.physicsWorld.removeBody(this.sueloCuerpo);
    this.sueloCuerpo = null;
  }

  setPlaneando(valor) {
    this.planeando = Boolean(valor);
  }

  update(dt) {
    if (!this.activo) return;
    const posicion = restar(this.obtenerPosicion(), this.origen);

    // El golpe se resuelve antes de avanzar la ventana de parry: un parry
    // pulsado en este frame sigue contando aunque el frame sea largo.
    const ataque = this.jefe.update(dt, { posicion });
    if (ataque) {
      const resultado = this.estado.recibirAtaque(ataque);
      if (resultado.parried) this.jefe.desarmar(1);
    }

    this.estado.update(dt, {
      posicion,
      orientacion: this.obtenerOrientacion(),
      moviendose: this.estaMoviendose(),
      planeando: this.planeando
    });
    this.sincronizarVida(this.estado.vida);

    if (this.estado.consumirImpactoDisco()) {
      this.jefe.golpear(SOMBRERO.danioDisco, {
        rompePostura: this.estado.transformacion === 'jaguar'
      });
    }

    if (this.jefe.derrotada && !this.recompensaEntregada) {
      this.recompensaEntregada = true;
      this.emitir('prototipo:victoria', { recompensa: 'Hebra de la cabellera de la Siguanaba' });
      this.onVictoria();
    }

    this.arena.update(dt);
    this.visuals.actualizar(dt, {
      estado: this.estado,
      jefe: this.jefe,
      posicionJugador: posicion,
      activo: true
    });
    this.hud?.actualizar(this.estado, this.jefe);
  }

  ejecutarAccion(accion) {
    if (!this.activo) return false;
    if (accion.startsWith('forma:')) return this.transformarse(accion.slice(6));
    switch (accion) {
      case 'parry': return this.parry();
      case 'disco': return this.lanzarDisco();
      case 'huella': return this.saltarHuella();
      case 'esquiva': return this.esquivar();
      case 'tonico': return this.usarTonico();
      default: return false;
    }
  }

  parry() { return this.estado.startParry(); }
  lanzarDisco() { return this.estado.throwDisc(); }
  esquivar() { return this.estado.esquivar(); }
  usarTonico() { return this.estado.usarTonico(); }
  transformarse(id) { return this.estado.activarTransformacion(id); }

  saltarHuella() {
    const destino = this.estado.blink();
    if (!destino) return false;
    this.teletransportar(sumar(this.origen, destino));
    return true;
  }

  descansar() {
    this.estado.descansar();
    this.sincronizarVida(this.estado.vida);
  }

  /** Reaparece en el Rescoldo de Ceniza del sector tras una derrota. */
  respawn() {
    this.descansar();
    this.teletransportar(sumar(this.origen, this.arena.getPuntoEntrada()));
    this.emitir('sector:respawn');
  }

  serialize() {
    return { estado: this.estado.serialize(), vencido: this.jefe.derrotada };
  }

  restore(data) {
    if (!data || typeof data !== 'object') return;
    this.estado.restore(data.estado);
    if (data.vencido) {
      this.jefe.vida = 0;
      this.jefe.estado = 'derrotada';
      this.recompensaEntregada = true;
    }
  }

  dispose() {
    this.activo = false;
    this.retirarSueloFisico();
    this.hud?.dispose();
    this.visuals.dispose();
    this.arena.dispose();
  }
}
