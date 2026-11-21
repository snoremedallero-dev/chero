import { GLIFOS } from './constants.js';

const ACCIONES = [
  { id: 'parry', tecla: 'V', etiqueta: 'Parry', glifo: GLIFOS.centro },
  { id: 'disco', tecla: 'X', etiqueta: 'Disco', glifo: GLIFOS.huella },
  { id: 'huella', tecla: 'Z', etiqueta: 'Huella', glifo: GLIFOS.ceniza },
  { id: 'esquiva', tecla: 'R', etiqueta: 'Esquiva', glifo: GLIFOS.aliento },
  { id: 'tonico', tecla: 'T', etiqueta: 'Tónico', glifo: GLIFOS.vida }
];

const FORMAS = [
  { id: 'duende', tecla: 'J', etiqueta: 'Duende' },
  { id: 'jaguar', tecla: 'K', etiqueta: 'Jaguar' },
  { id: 'torogoz', tecla: 'M', etiqueta: 'Torogoz' }
];

/** HUD autocontenido del prototipo; no depende del HUD principal ni de librerías. */
export class CipitioHUD {
  constructor({ contenedor = globalThis.document?.body, onAccion = () => {} } = {}) {
    this.onAccion = onAccion;
    this.raiz = null;
    this.avisoTemporizador = null;
    if (!contenedor) return;

    this.raiz = document.createElement('div');
    this.raiz.id = 'cipitio-overlay';
    this.raiz.className = 'cipitio-overlay';
    this.raiz.hidden = true;
    this.raiz.innerHTML = this.plantilla();
    contenedor.appendChild(this.raiz);

    this.raiz.querySelectorAll('[data-accion]').forEach((boton) => {
      boton.addEventListener('click', () => this.onAccion(boton.dataset.accion));
    });
    this.barras = {
      vida: this.raiz.querySelector('[data-barra="vida"]'),
      aliento: this.raiz.querySelector('[data-barra="aliento"]'),
      ceniza: this.raiz.querySelector('[data-barra="ceniza"]'),
      jefe: this.raiz.querySelector('[data-barra="jefe"]')
    };
    this.textos = {
      forma: this.raiz.querySelector('[data-texto="forma"]'),
      fase: this.raiz.querySelector('[data-texto="fase"]'),
      aviso: this.raiz.querySelector('[data-texto="aviso"]'),
      tonico: this.raiz.querySelector('[data-texto="tonico"]'),
      avisoGeneral: this.raiz.querySelector('[data-texto="aviso-general"]')
    };
  }

  plantilla() {
    const botones = ACCIONES.map((accion) => `
      <button class="cipitio-accion" data-accion="${accion.id}" type="button">
        <span class="cipitio-glifo">${accion.glifo}</span>
        <span>${accion.etiqueta}</span><kbd>${accion.tecla}</kbd>
      </button>`).join('');
    const formas = FORMAS.map((forma) => `
      <button class="cipitio-accion cipitio-forma" data-accion="forma:${forma.id}" type="button">
        <span>${forma.etiqueta}</span><kbd>${forma.tecla}</kbd>
      </button>`).join('');

    return `
      <div class="cipitio-panel cipitio-recursos">
        <div class="cipitio-titulo">${GLIFOS.centro} CAPÍTULO 1 · LAS CENIZAS DE IZALCO</div>
        <div class="cipitio-barra"><span>${GLIFOS.vida} Vida</span><div class="cipitio-pista"><i data-barra="vida"></i></div></div>
        <div class="cipitio-barra"><span>${GLIFOS.aliento} Aliento</span><div class="cipitio-pista"><i data-barra="aliento"></i></div></div>
        <div class="cipitio-barra"><span>${GLIFOS.ceniza} Ceniza</span><div class="cipitio-pista"><i data-barra="ceniza"></i></div></div>
        <div class="cipitio-estado">
          <span data-texto="forma">Forma: ninguna</span>
          <span data-texto="tonico">Tónicos: 3</span>
        </div>
      </div>
      <div class="cipitio-panel cipitio-jefe-panel">
        <div class="cipitio-jefe-nombre">${GLIFOS.jefe} LA SIGUANABA, LA MADRE TRAICIONADA</div>
        <div class="cipitio-pista cipitio-pista-jefe"><i data-barra="jefe"></i></div>
        <div class="cipitio-estado"><span data-texto="fase">Fase I</span><span data-texto="aviso"></span></div>
      </div>
      <div class="cipitio-acciones">${botones}${formas}</div>
      <div class="cipitio-aviso" data-texto="aviso-general" hidden></div>`;
  }

  setVisible(visible) {
    if (this.raiz) this.raiz.hidden = !visible;
  }

  actualizar(estado, jefe) {
    if (!this.raiz || !estado) return;
    const porcentaje = (valor, maximo) => `${Math.max(0, Math.min(100, (valor / maximo) * 100))}%`;
    this.barras.vida.style.width = porcentaje(estado.vida, estado.recursos.vida);
    this.barras.aliento.style.width = porcentaje(estado.aliento, estado.recursos.aliento);
    this.barras.ceniza.style.width = porcentaje(estado.ceniza, estado.recursos.ceniza);
    this.textos.forma.textContent = `Forma: ${estado.transformacionActiva || 'ninguna'}`;
    this.textos.tonico.textContent = `Tónicos: ${estado.tonico}`;

    if (jefe) {
      this.barras.jefe.style.width = porcentaje(jefe.vida, jefe.datos.vida);
      this.textos.fase.textContent = `Fase ${jefe.fase === 1 ? 'I' : 'II'}`;
      const telegrafo = jefe.telegrafo;
      this.textos.aviso.textContent = telegrafo
        ? `${GLIFOS.cambio} ${telegrafo.nombre}${telegrafo.parryable ? ' · PARRY' : ' · EVITA'}`
        : '';
      this.textos.aviso.className = telegrafo && !telegrafo.parryable ? 'cipitio-aviso-peligro' : '';
    }
  }

  avisar(texto, duracion = 1800) {
    if (!this.textos?.avisoGeneral) return;
    this.textos.avisoGeneral.textContent = texto;
    this.textos.avisoGeneral.hidden = false;
    clearTimeout(this.avisoTemporizador);
    this.avisoTemporizador = setTimeout(() => {
      if (this.textos?.avisoGeneral) this.textos.avisoGeneral.hidden = true;
    }, duracion);
  }

  dispose() {
    clearTimeout(this.avisoTemporizador);
    this.raiz?.remove();
    this.raiz = null;
  }
}
