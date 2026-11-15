(() => {
  "use strict";

  const assets = new URL("comando/", document.currentScript.src);
  const portraits = new URL("titulares/", assets);
  const forces = {
    eb: ["do Exército", "General do Exército · Uniforme 5 A1"],
    fab: ["da Aeronáutica", "Tenente-Brigadeiro do Ar · Uniforme 5 A"],
    mb: ["da Marinha", "Almirante de Esquadra · Uniforme branco 5.5"],
    pm: ["da Polícia Militar", "Uniforme de passeio · 2º A"],
    cbm: ["do Corpo de Bombeiros Militar", "Uniforme de passeio"]
  };
  const statuses = {
    vago: "Cargo vago",
    aguardando_historico: "Titular em verificação",
    ordem_indeterminada: "Titular em verificação",
    retrato_pendente: "Retrato em preparação",
    consulta_indisponivel: "Consulta ao Roblox indisponível",
    configuracao_pendente: "Cargo em configuração"
  };
  const modelViewer = "https://ajax.googleapis.com/ajax/libs/model-viewer/4.1.0/model-viewer.min.js";
  let viewerModule;
  let loading = false;

  function renderBase(section, key) {
    const [label, uniform] = forces[key];
    const title = key === "pm" || key === "cbm" ? "Comandante-Geral" : "Comandante";
    section.dataset.force = key;
    delete section.dataset.titular;
    section.innerHTML = `
      <picture class="quadro-bandeira" aria-hidden="true">
        <source media="(prefers-reduced-motion: no-preference)" srcset="${assets}${key}-animado.webp">
        <img src="${assets}${key}-bandeira.webp" alt="" width="720" height="454">
      </picture>
      <div class="quadro-titulo">
        <h2><span>${title}</span> <em>${label}</em></h2>
        <p>${uniform}</p>
      </div>
      <div class="quadro-retrato">
        <img src="${assets}${key}-farda.webp" alt="Farda de comando ${label}" width="900" height="1080">
      </div>`;
  }

  function validModel(row, force) {
    if (!Number.isSafeInteger(row.id) || row.id < 1 ||
        typeof row.usuario !== "string" || !/^[A-Za-z0-9_]{1,20}$/.test(row.usuario)) return false;
    const directory = new RegExp("^" + force + "/" + row.id + "-[a-f0-9]{12}/");
    if (typeof row.imagem !== "string" || typeof row.modelo !== "string") return false;
    const imageDirectory = row.imagem.match(directory)?.[0];
    return imageDirectory && row.imagem === imageDirectory + "retrato.webp" &&
      row.modelo === imageDirectory + "avatar-r6.glb";
  }

  function addPresentation(viewer, title) {
    if (!viewer.availableAnimations.includes("apresentacao")) return;
    viewer.animationName = "apresentacao";
    const play = document.createElement("button");
    play.className = "quadro-apresentacao";
    play.type = "button";
    play.textContent = "Ver apresentação";
    play.addEventListener("click", () => {
      if (!viewer.paused) return;
      viewer.currentTime = 0;
      viewer.play({ repetitions: 1 });
      play.setAttribute("aria-disabled", "true");
      play.textContent = "Apresentação em andamento";
    });
    viewer.addEventListener("finished", () => {
      play.removeAttribute("aria-disabled");
      play.textContent = "Rever apresentação";
    });
    title.append(play);
    return play;
  }

  async function showModel(portrait, poster, row, title) {
    try {
      viewerModule ??= import(modelViewer).catch(error => {
        viewerModule = null;
        throw error;
      });
      await viewerModule;
      if (!portrait.isConnected) return;
      const viewer = document.createElement("model-viewer");
      let play;
      viewer.setAttribute("alt", poster.alt);
      viewer.setAttribute("camera-controls", "");
      viewer.setAttribute("touch-action", "pan-y");
      viewer.setAttribute("disable-zoom", "");
      viewer.setAttribute("interaction-prompt", "none");
      viewer.setAttribute("camera-orbit", "145deg 82deg 140%");
      const targetY = portrait.closest("[data-quadro-comando]").dataset.quadroComando === "fab" ? 3.03 : 3.2;
      viewer.setAttribute("camera-target", `0m ${targetY}m 0m`);
      viewer.setAttribute("field-of-view", "32deg");
      viewer.addEventListener("error", () => {
        poster.hidden = false;
        play?.remove();
        viewer.remove();
      }, { once: true });
      viewer.addEventListener("load", () => {
        poster.hidden = true;
        viewer.classList.add("pronto");
        play = addPresentation(viewer, title);
      }, { once: true });
      viewer.setAttribute("src", new URL(row.modelo, portraits).href);
      portrait.append(viewer);
    } catch {
      // O retrato gerado do próprio modelo permanece visível.
    }
  }

  async function update(section, key, row) {
    const revision = JSON.stringify(row);
    if (section.dataset.modeloAtual === revision) return;
    section.dataset.modeloAtual = revision;
    renderBase(section, key);
    const title = section.querySelector(".quadro-titulo");
    const portrait = section.querySelector(".quadro-retrato");
    if (row.estado !== "titular") {
      if (!statuses[row.estado]) return;
      const status = document.createElement("p");
      status.className = "quadro-titular-status";
      status.textContent = statuses[row.estado];
      title.append(status);
      return;
    }
    if (!validModel(row, key)) return;
    const poster = new Image(720, 900);
    poster.alt = "Avatar R6 de " + row.usuario + " com a farda da força";
    poster.decoding = "async";
    poster.src = new URL(row.imagem, portraits).href;
    try {
      await poster.decode();
    } catch {
      // A malha ainda pode ser carregada, mesmo se a imagem de apoio falhar.
    }
    if (!portrait.isConnected) return;
    const name = document.createElement("a");
    name.className = "quadro-titular-nome";
    name.textContent = row.usuario;
    name.href = "https://www.roblox.com/pt/users/" + row.id + "/profile";
    title.querySelector("h2").after(name);
    section.dataset.titular = "true";
    if (poster.naturalWidth > 0) portrait.replaceChildren(poster);
    showModel(portrait, poster, row, title);
  }

  const sections = Array.from(document.querySelectorAll("[data-quadro-comando]"))
    .filter(section => Object.hasOwn(forces, section.dataset.quadroComando));
  for (const section of sections) renderBase(section, section.dataset.quadroComando);
  if (!sections.length) return;

  async function load() {
    if (loading) return;
    loading = true;
    try {
      const response = await fetch(new URL("comando.json", portraits), { cache: "no-store" });
      if (!response.ok) return;
      const snapshot = await response.json();
      await Promise.all(sections.map(section => {
        const force = section.dataset.quadroComando;
        return snapshot?.[force] ? update(section, force, snapshot[force]) : null;
      }));
    } catch {
      // Uma falha de rede não apaga um quadro já carregado.
    } finally {
      loading = false;
    }
  }

  load();
  setInterval(() => { if (!document.hidden) load(); }, 5 * 60 * 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });
})();
