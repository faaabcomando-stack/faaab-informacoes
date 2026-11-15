(() => {
  'use strict';
  const forces = window.FAAAB_HIERARQUIAS?.forcas;
  if (!forces) return;
  const offices = {
    eb: ["Subcomandante", "Comandante"],
    fab: ["Subcomandante da FAB", "Comandante da FAB"],
    mb: ["Subcomandante da Marinha", "Comandante da Marinha"],
    cbm: ["Subcomandante-Geral", "Comandante-Geral"],
    pm: ["Subcomandante-Geral", "Comandante-Geral"]
  };
  for (const [key, patentes] of Object.entries(offices)) {
    const group = { titulo: "Comando", patentes, funcoes: true };
    forces[key].grupos.push(group);
  }
})();
