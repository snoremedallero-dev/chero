import * as THREE from 'three';
import { Lighting } from '../core/Lighting.js';
import { Baseplate } from './Baseplate.js';

/**
 * Gestor del entorno del mundo, iluminación, terreno y objetos espaciales.
 */
export class World {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;

    this.lighting = new Lighting(this.scene);
    this.baseplate = new Baseplate(this.physicsWorld, 120, 2);

    this.scene.add(this.baseplate.group);
  }

  /**
   * Añade un objeto o parte 3D a la escena gráfica.
   */
  add(object) {
    this.scene.add(object);
  }

  /**
   * Remueve un objeto de la escena gráfica.
   */
  remove(object) {
    this.scene.remove(object);
  }
}
