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
  let modelsSnapshot = null;
  let membersSnapshot = null;

  function renderBase(section, key) {
    const [label, uniform] = forces[key];
    const office = section.dataset.office === "subcomandante" ? "subcomandante" : "comandante";
    const general = key === "pm" || key === "cbm";
    const title = office === "subcomandante" ? (general ? "Subcomandante-Geral" : "Subcomandante") :
      (general ? "Comandante-Geral" : "Comandante");
    section.dataset.force = key;
    delete section.dataset.titular;
    section.innerHTML = `
      <picture class="quadro-bandeira" aria-hidden="true">
        <source media="(prefers-reduced-motion: no-preference)" srcset="${assets}${key}-animado.webp">
        <img src="${assets}${key}-bandeira.webp" alt="" width="720" height="454">
      </picture>
      <div class="quadro-titulo">
        <div class="quadro-cargos" role="group" aria-label="Escolher função de comando">
          <button type="button" class="quadro-cargo" data-office="comandante" aria-pressed="${office === "comandante"}">Comandante</button>
          <button type="button" class="quadro-cargo" data-office="subcomandante" aria-pressed="${office === "subcomandante"}">Subcomandante</button>
        </div>
        <h2><span>${title}</span> <em>${label}</em></h2>
        <p>${uniform}</p>
      </div>
      <div class="quadro-retrato">
        <img src="${assets}${key}-farda.webp" alt="Farda de comando ${label}" width="900" height="1080">
      </div>`;
    section.querySelectorAll(".quadro-cargo").forEach(button => {
      button.addEventListener("click", () => {
        if (section.dataset.office === button.dataset.office) return;
        section.dataset.office = button.dataset.office;
        delete section.dataset.modeloAtual;
        paint(section);
        section.querySelector(".quadro-cargo[aria-pressed='true']")?.focus();
      });
    });
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
    const revision = JSON.stringify({ office: "comandante", row });
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
    if (!portrait.isConnected || section.dataset.office === "subcomandante") return;
    const name = document.createElement("a");
    name.className = "quadro-titular-nome";
    name.textContent = row.usuario;
    name.href = "https://www.roblox.com/pt/users/" + row.id + "/profile";
    title.querySelector("h2").after(name);
    section.dataset.titular = "true";
    if (poster.naturalWidth > 0) portrait.replaceChildren(poster);
    showModel(portrait, poster, row, title);
  }


  function safeAvatar(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && (
        parsed.hostname === "rbxcdn.com" || parsed.hostname.endsWith(".rbxcdn.com")
      ) ? parsed.href : null;
    } catch { return null; }
  }

  function updateFromMembers(section, key, row, office) {
    const revision = JSON.stringify({ office, row: row || null });
    if (section.dataset.modeloAtual === revision) return;
    section.dataset.modeloAtual = revision;
    renderBase(section, key);
    const title = section.querySelector(".quadro-titulo");
    const portrait = section.querySelector(".quadro-retrato");
    const verified = row?.estado === "titular";
    const last = row?.estado === "consulta_indisponivel" ? row?.ultimo_confirmado : null;
    const person = verified ? row : last;
    const status = document.createElement("p");
    status.className = "quadro-titular-status";
    if (person && Number.isSafeInteger(person.usuario_id) && person.usuario_id > 0) {
      const link = document.createElement("a");
      link.className = "quadro-titular-nome";
      link.href = "https://www.roblox.com/users/" + person.usuario_id + "/profile";
      link.rel = "noopener noreferrer";
      link.target = "_blank";
      link.textContent = person.nome_usuario ? "@" + person.nome_usuario : "Roblox #" + person.usuario_id;
      title.querySelector("h2").after(link);
      status.textContent = verified
        ? "Ocupante confirmado no cargo do grupo"
        : "Último ocupante confirmado; consulta indisponível";
      const avatar = safeAvatar(person.avatar_url);
      if (avatar) {
        const thumb = document.createElement("img");
        thumb.alt = "Avatar atual de " + (person.nome_usuario || person.usuario_id) +
          " no Roblox; a farda da FAAAB não foi aplicada ao modelo 3D";
        thumb.src = avatar;
        thumb.onerror = () => {
          thumb.onerror = null;
          thumb.remove();
        };
        portrait.replaceChildren(thumb);
        section.dataset.titular = "true";
      }
    } else {
      const labels = {
        vago: "Cargo vago",
        aguardando_historico: "Aguardando histórico de ocupação",
        ordem_indeterminada: "Ordem dos ocupantes não confirmada",
        configuracao_pendente: "Cargo ainda não configurado",
        consulta_indisponivel: "Consulta ao Roblox indisponível"
      };
      status.textContent = row ? (labels[row.estado] || "Cargo em atualização") : "Aguardando dados do Roblox";
    }
    title.append(status);
    const note = document.createElement("small");
    note.className = "quadro-nota-avatar";
    note.textContent = "Miniatura Roblox; farda 3D personalizada não gerada para este cargo";
    portrait.append(note);
  }

  function paint(section) {
    const key = section.dataset.quadroComando;
    const office = section.dataset.office === "subcomandante" ? "subcomandante" : "comandante";
    const current = membersSnapshot?.forcas?.[key]?.[office];
    if (office === "subcomandante") {
      updateFromMembers(section, key, current, office);
      return;
    }
    const model = modelsSnapshot?.[key];
    const modelMatchesRole = !current || (
      current.estado === "titular" && current.usuario_id === model?.id
    );
    if (model && model.estado === "titular" && validModel(model, key) && modelMatchesRole) {
      update(section, key, model);
    } else if (current) {
      updateFromMembers(section, key, current, office);
    } else if (model) {
      update(section, key, model);
    } else {
      updateFromMembers(section, key, null, office);
    }
  }

  const sections = Array.from(document.querySelectorAll("[data-quadro-comando]"))
    .filter(section => Object.hasOwn(forces, section.dataset.quadroComando));
  for (const section of sections) {
    section.dataset.office = new URLSearchParams(location.search).get("cargo") === "subcomandante"
      ? "subcomandante" : "comandante";
    renderBase(section, section.dataset.quadroComando);
  }
  if (!sections.length) return;

  async function load() {
    if (loading) return;
    loading = true;
    try {
      const [models, members] = await Promise.allSettled([
        fetch(new URL("comando.json", portraits), { cache: "no-store" })
          .then(r => { if (!r.ok) throw new Error("Modelos indisponíveis"); return r.json(); }),
        fetch(new URL("titulares.json", assets), { cache: "no-store" })
          .then(r => { if (!r.ok) throw new Error("Cargos indisponíveis"); return r.json(); })
      ]);
      if (models.status === "fulfilled" && models.value && typeof models.value === "object") {
        modelsSnapshot = models.value;
      }
      if (members.status === "fulfilled" && members.value?.versao === 1) {
        membersSnapshot = members.value;
      }
      await Promise.all(sections.map(paint));
    } catch {
      // A indisponibilidade não interrompe a navegação entre as funções.
    } finally {
      loading = false;
    }
  }

  load();
  setInterval(() => { if (!document.hidden) load(); }, 5 * 60 * 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });
})();
