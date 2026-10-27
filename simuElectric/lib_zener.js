/**
 * LIBRERÍA EXTERNA DE COMPONENTE: DIODO ZENER
 * Autor: Jesús Moreno Calvo — I.E.S. Galileo Galilei
 * Licencia: MIT
 */

window.RegistrarComponente({
  type: 'zener',
  name: 'Diodo Zener',
  icon: '⚡|',
  category: 'semiconductores', // Puede ser 'semiconductores', 'pasivos', 'fuentes' o 'librerias'

  // Valores por defecto al colocarlo en el lienzo
  defaults: {
    vz: 5.1 // Voltaje de ruptura Zener (V_Z) por defecto: 5.1 V
  },

  // Posición relativa de los bornes (Pin 0: Ánodo, Pin 1: Cátodo)
  pins: function(c) {
    return [
      { x: -40, y: 0, name: 'A' },
      { x:  40, y: 0, name: 'K' }
    ];
  },

  // Modelo matemático MNA (conducción directa a ~0.7V + ruptura inversa en -Vz)
  stamp: function(c, api) {
    const vd = api.vPins[0] - api.vPins[1]; // V_AK = V_Ánodo - V_Cátodo
    const vz = c.vz || 5.1;

    // 1. Rama en polarización directa (Ánodo -> Cátodo)
    const dFwd = api.diodeEval(vd);

    // 2. Rama en ruptura Zener inversa (conduce cuando V_KA > Vz, es decir V_AK < -Vz)
    const vRev = -vd - vz + 0.65;
    const dRev = api.diodeEval(vRev);

    const gTotal = dFwd.g + dRev.g;
    const iTotal = dFwd.i - dRev.i;

    api.stampG(api.nPins[0], api.nPins[1], gTotal);
    api.stampI(api.nPins[0], api.nPins[1], iTotal - gTotal * vd);
  },

  // Cálculo de magnitudes tras resolver el circuito e inyección KCL en los cables
  updateState: function(c, api) {
    if (api.isOpen) {
      c.dv = 0; c.i = 0; c.p = 0;
      return;
    }
    const vd = api.vPins[0] - api.vPins[1];
    const vz = c.vz || 5.1;
    const dFwd = api.diodeEval(vd);
    const dRev = api.diodeEval(-vd - vz + 0.65);

    c.dv = vd;
    c.i = dFwd.i - dRev.i; // Positiva de Ánodo a Cátodo, negativa en regulación Zener
    c.p = Math.abs(c.dv * c.i);

    // Inyectar corriente exacta a la red de cables (KCL)
    api.addInj(0, -c.i);
    api.addInj(1, +c.i);
  },

  // Dibujo vectorial del símbolo normalizado del Diodo Zener + animación de corriente
  draw: function(ctx, c, ui) {
    ctx.beginPath();
    // Hilos extremos
    ctx.moveTo(-40, 0); ctx.lineTo(-10, 0);
    ctx.moveTo(10, 0);  ctx.lineTo(40, 0);
    // Triángulo del ánodo
    ctx.moveTo(-10, -11); ctx.lineTo(-10, 11); ctx.lineTo(10, 0); ctx.closePath();
    ctx.stroke();

    // Línea quebrada característica del cátodo Zener (alas en Z)
    ctx.beginPath();
    ctx.moveTo(4, -14);
    ctx.lineTo(10, -11);
    ctx.lineTo(10, 11);
    ctx.lineTo(16, 14);
    ctx.stroke();

    // Partículas de corriente atravesando el Diodo Zener
    ui.drawParticlesOnPath([{x: -40, y: 0}, {x: 40, y: 0}], c.i);
  },

  // Etiqueta flotante sobre el símbolo en el lienzo
  label: function(c, formatUnit) {
    return `Vz=${c.vz}V (${formatUnit(Math.abs(c.i || 0), 'A')})`;
  },

  // Información al poner el puntero encima (Tooltip)
  tooltip: function(c, formatUnit) {
    let estado = 'En Corte (Bloqueo)';
    if ((c.dv || 0) > 0.55) estado = 'Conducción Directa';
    else if ((c.dv || 0) < -(c.vz - 0.3)) estado = 'Regulación Zener (Ruptura)';

    return `<h4>⚡| Diodo Zener (Vz = ${c.vz} V)</h4>
      <div class="kv"><span>Estado:</span><span>${estado}</span></div>
      <div class="kv"><span>Voltaje (V_AK):</span><span>${formatUnit(c.dv || 0, 'V')}</span></div>
      <div class="kv"><span>Voltaje Inverso (V_KA):</span><span>${formatUnit(-(c.dv || 0), 'V')}</span></div>
      <div class="kv"><span>Intensidad (I):</span><span>${formatUnit(Math.abs(c.i || 0), 'A')}</span></div>
      <div class="kv"><span>Potencia Disipada (P):</span><span>${formatUnit(c.p || 0, 'W')}</span></div>`;
  },

  // Controles de edición en el panel derecho al hacer clic sobre el Zener
  properties: function(c) {
    return `<div class="field">
      <label>Voltaje Zener V_Z (V): <b id="lblVz">${c.vz} V</b></label>
      <input type="range" min="2.4" max="24" step="0.1" value="${c.vz}"
        oninput="selected.vz=Number(this.value); document.getElementById('lblVz').textContent=this.value+' V'; document.getElementById('numVz').value=this.value;">
      <input id="numVz" type="number" step="0.1" min="1.2" max="100" value="${c.vz}" style="margin-top:5px"
        oninput="selected.vz=Math.max(1,Number(this.value)); document.getElementById('lblVz').textContent=this.value+' V';">
    </div>`;
  }
});