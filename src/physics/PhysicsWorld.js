import * as CANNON from 'cannon-es';

/**
 * Gestor del mundo físico de colisiones y dinámica de cuerpos rígidos con Cannon-es.
 */
export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World();

    // Gravedad arcade: caída rápida y controlada
    this.world.gravity.set(0, -28, 0);

    // NaiveBroadphase es más confiable con muchos cuerpos estáticos
    this.world.broadphase = new CANNON.NaiveBroadphase();
    // CRÍTICO: Desactivar sleep global — evita que el cuerpo del jugador se "duerma" y deje de moverse
    this.world.allowSleep = false;

    // Materiales de física y fricción
    this.initMaterials();

    // Cuerpos registrados para actualización
    this.bodies = [];
  }

  initMaterials() {
    this.groundMaterial = new CANNON.Material('ground');
    this.playerMaterial = new CANNON.Material('player');
    this.blockMaterial = new CANNON.Material('block');

    // Contacto entre jugador y suelo/bloques (sin fricción pegajosa en paredes)
    const playerGroundContact = new CANNON.ContactMaterial(
      this.playerMaterial,
      this.groundMaterial,
      {
        friction: 0.1,
        restitution: 0.0 // Sin rebote al aterrizar
      }
    );
    this.world.addContactMaterial(playerGroundContact);

    const playerBlockContact = new CANNON.ContactMaterial(
      this.playerMaterial,
      this.blockMaterial,
      {
        friction: 0.05,
        restitution: 0.0
      }
    );
    this.world.addContactMaterial(playerBlockContact);
  }

  /**
   * Añade un cuerpo rígido al mundo físico.
   */
  addBody(body) {
    this.world.addBody(body);
    this.bodies.push(body);
  }

  /**
   * Remueve un cuerpo del mundo físico.
   */
  removeBody(body) {
    this.world.removeBody(body);
    const index = this.bodies.indexOf(body);
    if (index !== -1) {
      this.bodies.splice(index, 1);
    }
  }

  /**
   * Avanza la simulación física un paso en el tiempo.
   * @param {number} dt Delta time en segundos
   */
  step(dt) {
    // Paso de tiempo fijo a 60 Hz para estabilidad física
    this.world.step(1 / 60, Math.min(dt, 0.1), 3);
  }
}
