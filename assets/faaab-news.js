/* O mesmo catálogo alimenta a central e as páginas de notícias das forças. */
(() => {
  'use strict';
  const central = document.querySelector('[data-publication-list]');
  const force = document.body.dataset.forceNews;
  if (!central && !force) return;

  const base = central ? '' : '../';
  const forceNames = {
    eb: 'Exército Brasileiro', mb: 'Marinha Brasileira', fab: 'Força Aérea Brasileira',
    cbm: 'Corpo de Bombeiros Militar', pm: 'Polícia Militar'
  };
  const dateFormat = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric'
  });

  function valid(entry) {
    if (!entry || entry.status !== 'publicado' || !/^[a-z0-9-]+$/.test(entry.id || '') ||
        !Object.hasOwn(forceNames, entry.forca) || !['publicacao', 'comunicado'].includes(entry.tipo) ||
        typeof entry.titulo !== 'string' || !entry.titulo.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(entry.data || '')) return false;
    const date = new Date(entry.data + 'T12:00:00Z');
    return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === entry.data;
  }

  function story(entry) {
    const link = document.createElement('a');
    link.href = base + 'publicacoes/materia.html?id=' + encodeURIComponent(entry.id);
    link.className = 'fx-story';
    const hasImage = entry.credito && typeof entry.imagem === 'string' && /^(https:\/\/|assets\/)/.test(entry.imagem);
    if (hasImage) {
      const photo = document.createElement('img');
      photo.alt = entry.alt || '';
      photo.loading = 'lazy';
      photo.decoding = 'async';
      photo.src = entry.imagem.startsWith('assets/') ? base + entry.imagem : entry.imagem;
      photo.className = 'fx-story-photo';
      link.append(photo);
    }
    const inner = document.createElement('div');
    inner.className = 'fx-story-text';
    const date = document.createElement('time');
    date.dateTime = entry.data;
    date.textContent = dateFormat.format(new Date(entry.data + 'T12:00:00Z'));
    const kind = document.createElement('span');
    kind.className = 'fx-story-kind';
    kind.textContent = (entry.tipo === 'comunicado' ? 'Comunicado' : 'Publicação') + ' · ' + forceNames[entry.forca];
    const title = document.createElement('strong');
    title.textContent = entry.titulo;
    inner.append(date, kind, title);
    if (hasImage) {
      const caption = document.createElement('small');
      caption.className = 'fx-story-credit';
      caption.textContent = 'Imagem: ' + entry.credito;
      inner.append(caption);
    }
    link.append(inner);
    return link;
  }

  function status(message) {
    const element = central?.querySelector('[role=status]');
    if (element) element.textContent = message;
  }

  async function load() {
    try {
      const response = await fetch(base + 'assets/publicacoes-data.json', {cache:'no-cache'});
      if (!response.ok) throw Error('Catálogo indisponível');
      const entries = await response.json();
      if (!Array.isArray(entries)) throw Error('Catálogo inválido');
      const news = entries.filter(entry => valid(entry) && (!force || entry.forca === force))
        .sort((a,b) => b.data.localeCompare(a.data));
      if (!news.length) {
        status('Ainda não há notícias ou comunicados publicados.');
        return;
      }
      const grid = document.createElement('div');
      grid.className = central ? 'fx-central-articles' : 'fx-force-articles';
      grid.append(...news.map(story));
      if (central) central.replaceChildren(grid);
      else (document.querySelector('.eb-news-empty') || document.querySelector('.section .empty'))?.replaceWith(grid);
    } catch (error) {
      status('O noticiário está temporariamente indisponível. Tente recarregar a página.');
      console.warn('Noticiário FAAAB:', error.message);
    }
  }

  load();
})();
