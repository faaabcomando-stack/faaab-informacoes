(() => {
  "use strict";

  const assetBase = new URL("comando/", document.currentScript.src);
  const forces = {
    eb: { name: "do Exército", uniform: "General do Exército · Uniforme 5 A1" },
    fab: { name: "da Aeronáutica", uniform: "Tenente-Brigadeiro do Ar · Uniforme 5 A" },
    mb: { name: "da Marinha", uniform: "Almirante de Esquadra · Uniforme branco 5.5" },
    pm: { name: "da Polícia Militar", uniform: "Uniforme de passeio · 2º A", general: true },
    cbm: { name: "do Corpo de Bombeiros Militar", uniform: "Uniforme de passeio", general: true }
  };

  function render(container, key) {
    const force = forces[key];
    if (!container || !force || container.dataset.force === key) return;
    container.dataset.force = key;
    container.innerHTML = `
      <picture class="quadro-bandeira" aria-hidden="true">
        <source media="(prefers-reduced-motion: no-preference)" srcset="${assetBase}${key}-animado.webp">
        <img src="${assetBase}${key}-bandeira.webp" alt="" width="720" height="454">
      </picture>
      <div class="quadro-titulo">
        <h2><span>${force.general ? "Comandante-Geral" : "Comandante"}</span> <em>${force.name}</em></h2>
        <p>${force.uniform}</p>
      </div>
      <div class="quadro-retrato">
        <img src="${assetBase}${key}-farda.webp" alt="Farda de comando ${force.name}, sem cobertura"
             width="900" height="1080">
      </div>`;
  }

  window.FAAABQuadroComando = render;
  for (const container of document.querySelectorAll("[data-quadro-comando]")) {
    render(container, container.dataset.quadroComando);
  }
})();
