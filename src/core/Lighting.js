import * as THREE from 'three';

/**
 * Iluminación toon de Chero World: dos tonos de luz, sombras duras y cielo
 * turquesa plano. La rampa de Materiales se controla en ToonStyle.js.
 */
export class Lighting {
  constructor(scene) {
    this.scene = scene;
    this.initLights();
    this.initAtmosphere();
  }

  initLights() {
    // Luz hemisférica: relleno plano para que la sombra toon siga siendo legible.
    this.hemiLight = new THREE.HemisphereLight(0xCDEDE5, 0x3D6B54, 0.55);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // Sol direccional: una sola fuente para obtener un corte de luz nítido.
    this.sunLight = new THREE.DirectionalLight(0xFFF3DC, 1.25);
    this.sunLight.position.set(45, 90, 35);
    this.sunLight.castShadow = true;

    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 320;

    // Cobertura amplia para que las sombras sigan existiendo al mover el sol.
    const d = 110;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;

    this.scene.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight(0xF6E9CF, 0.06);
    this.scene.add(this.ambientLight);
  }

  initAtmosphere() {
    const skyColor = new THREE.Color(0xA9D8CE);
    this.scene.background = skyColor;
    this.scene.fog = new THREE.Fog(skyColor, 90, 260);
  }
}
