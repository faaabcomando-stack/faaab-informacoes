(() => {
  "use strict";
  const scriptUrl = document.currentScript.src;
  const assetBase = new URL("comando/", scriptUrl);
  const holdersUrl = new URL("comando/titulares.json", scriptUrl);
  const forces = {
    eb: { name: "do Exército", uniform: "General do Exército · Uniforme 5 A1" },
    fab: { name: "da Aeronáutica", uniform: "Tenente-Brigadeiro do Ar · Uniforme 5 A" },
    mb: { name: "da Marinha", uniform: "Almirante de Esquadra · Uniforme branco 5.5" },
    pm: { name: "da Polícia Militar", uniform: "Uniforme de passeio · 2º A", general: true },
    cbm: { name: "do Corpo de Bombeiros Militar", uniform: "Uniforme de passeio", general: true }
  };
  let registry = null;
  let loaded = false;

  function safeAvatar(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && (
        parsed.hostname === "rbxcdn.com" || parsed.hostname.endsWith(".rbxcdn.com")
      ) ? parsed.href : null;
    } catch {
      return null;
    }
  }

  function refresh(container, key) {
    if (!container || container.dataset.force !== key) return;
    const holder = registry?.forcas?.[key]?.comandante;
    const caption = container.querySelector(".quadro-ocupante");
    const image = container.querySelector(".quadro-retrato img");
    const figure = container.querySelector(".quadro-retrato");
    if (!caption || !image || !figure) return;
    const basePhoto = new URL(key + "-farda.webp", assetBase).href;
    const fallback = () => {
      figure.classList.remove("quadro-avatar-real");
      image.src = basePhoto;
      image.alt = "Farda de referência da FAAAB, sem avatar de titular";
    };
    fallback();
    caption.replaceChildren();
    const line = document.createElement("strong");
    const note = document.createElement("small");
    const verified = holder?.estado === "titular";
    const old = holder?.estado === "consulta_indisponivel" ? holder?.ultimo_confirmado : null;
    const person = verified ? holder : old;
    const signature = JSON.stringify({key, estado:holder?.estado, usuario:person?.usuario_id, nome:person?.nome_usuario, avatar:person?.avatar_url, loaded});
    if (container.dataset.lastHolder === signature) return;
    container.dataset.lastHolder = signature;
    if (person?.usuario_id && Number.isSafeInteger(person.usuario_id) && person.usuario_id > 0) {
      const profile = document.createElement("a");
      profile.href = "https://www.roblox.com/users/" + person.usuario_id + "/profile";
      profile.target = "_blank";
      profile.rel = "noopener noreferrer";
      profile.textContent = person.nome_usuario
        ? "@" + person.nome_usuario : "Roblox #" + person.usuario_id;
      line.append(profile);
      note.textContent = verified
        ? "Titular confirmado pelo cargo do grupo"
        : "Último titular confirmado · consulta temporariamente indisponível";
      const avatar = safeAvatar(person.avatar_url);
      if (avatar) {
        image.src = avatar;
        image.alt = "Avatar atual de " + (person.nome_usuario || person.usuario_id) +
          " no Roblox; não representa a farda aplicada";
        figure.classList.add("quadro-avatar-real");
        image.onerror = () => {
          image.onerror = null;
          fallback();
        };
      }
    } else {
      const states = {
        vago: "Cargo de comandante vago",
        aguardando_historico: "Aguardando histórico do primeiro comandante",
        ordem_indeterminada: "Ordem de ingresso não confirmada",
        configuracao_pendente: "Cargo do grupo ainda não configurado",
        consulta_indisponivel: "Consulta ao Roblox indisponível"
      };
      line.textContent = holder ? (states[holder.estado] || "Comando em atualização")
        : (loaded ? "Consulta ainda não disponível" : "Verificando titular…");
      note.textContent = "Imagem: farda de referência, sem titular identificado";
    }
    caption.append(line, note);
    const extra = container.querySelector(".quadro-nota-avatar");
    if (extra) {
      extra.textContent = person && safeAvatar(person.avatar_url)
        ? "Avatar atual do Roblox · uniforme do jogo não aplicado"
        : "Farda ilustrativa · sem renderização do avatar";
    }
  }

  function render(container, key) {
    const force = forces[key];
    if (!container || !force) return;
    if (container.dataset.force !== key) {
      container.dataset.force = key;
      container.innerHTML = '<picture class="quadro-bandeira" aria-hidden="true">' +
        '<source media="(prefers-reduced-motion: no-preference)" srcset="' + assetBase + key + '-animado.webp">' +
        '<img src="' + assetBase + key + '-bandeira.webp" alt="" width="720" height="454"></picture>' +
        '<div class="quadro-titulo"><h2><span>' +
        (force.general ? 'Comandante-Geral' : 'Comandante') +
        '</span> <em>' + force.name + '</em></h2><p>Farda de referência: ' +
        force.uniform + '</p><div class="quadro-ocupante" aria-live="polite"></div></div>' +
        '<div class="quadro-retrato"><img src="' + assetBase + key +
        '-farda.webp" alt="Farda de referência sem titular identificado" width="900" height="1080">' +
        '<small class="quadro-nota-avatar">Farda ilustrativa · sem renderização do avatar</small></div>';
    }
    refresh(container, key);
  }

  window.FAAABQuadroComando = render;
  for (const el of document.querySelectorAll("[data-quadro-comando]")) {
    if (el.dataset.quadroComando) render(el, el.dataset.quadroComando);
  }
  let pending = false;
  function loadSnapshot() {
    if (pending) return;
    pending = true;
    fetch(holdersUrl, { cache: "no-store" }).then(r => {
      if (!r.ok) throw new Error("Snapshot indisponível");
      return r.json();
    }).then(data => {
      if (data?.versao !== 1 || !data.forcas || typeof data.forcas !== "object") {
        throw new Error("Snapshot inválido");
      }
      registry = data;
    }).catch(() => {
      // Não substituir uma consulta anterior por falha temporária do navegador.
      if (!loaded) registry = null;
    }).finally(() => {
      pending = false;
      loaded = true;
      document.querySelectorAll("[data-quadro-comando]").forEach(el => {
        const key = el.dataset.force || el.dataset.quadroComando;
        refresh(el, key);
      });
    });
  }
  loadSnapshot();
  setInterval(() => {
    if (!document.hidden) loadSnapshot();
  }, 5 * 60 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) loadSnapshot();
  });
})();
