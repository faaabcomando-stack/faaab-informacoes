/* Dados de hierarquia da simulação FAAAB. Somente patentes confirmadas, sem recriar cargos excluídos. */
window.FAAAB_HIERARQUIAS = {
  "versao": "2026-11-14 — correção solicitada pelo comando FAAAB",
  "forcas": {
    "eb": {
      "nome": "Exército Brasileiro",
      "sigla": "EB",
      "imagem": "assets/forcas/eb.png",
      "descricao": "Força terrestre: unidades de infantaria, apoio, instrução e comando.",
      "fonte": "Estrutura FAAAB com adaptações próprias.",
      "unidades": [
        "BPE",
        "BFE",
        "BIP",
        "BIB",
        "BCC",
        "BAC",
        "CIGS",
        "CIE",
        "B Sau — Batalhão de Saúde"
      ],
      "grupos": [
        {
          "titulo": "Ingresso",
          "patentes": [
            "Recruta"
          ]
        },
        {
          "titulo": "Praças",
          "patentes": [
            "Soldado",
            "Soldado de Primeira Classe",
            "Cabo"
          ]
        },
        {
          "titulo": "Graduados",
          "patentes": [
            "Terceiro-Sargento",
            "Segundo-Sargento",
            "Primeiro-Sargento",
            "Subtenente"
          ]
        },
        {
          "titulo": "Formação de oficiais",
          "patentes": [
            "Cadete",
            "Aspirante a Oficial"
          ]
        },
        {
          "titulo": "Oficiais",
          "patentes": [
            "Segundo-Tenente",
            "Primeiro-Tenente",
            "Capitão",
            "Capitão-Sênior",
            "Major",
            "Tenente-Coronel",
            "Coronel"
          ]
        },
        {
          "titulo": "Generalato",
          "patentes": [
            "General em Treinamento",
            "General de Brigada",
            "General de Divisão",
            "General de Exército",
            "Marechal"
          ]
        }
      ]
    },
    "fab": {
      "nome": "Força Aérea Brasileira",
      "sigla": "FAB",
      "imagem": "assets/forcas/fab.png",
      "descricao": "Força aérea: atividades de base, aviação, segurança, instrução e apoio.",
      "fonte": "Hierarquia adaptada da FAB com Comodoro do Ar na progressão própria do jogo FAAAB.",
      "unidades": [
        "GSD",
        "GDAAE",
        "1º GCC",
        "PARA-SAR",
        "GAV",
        "EAS"
      ],
      "grupos": [
        {
          "titulo": "Ingresso (etapa)",
          "patentes": [
            "Recruta"
          ]
        },
        {
          "titulo": "Praças",
          "patentes": [
            "Soldado de Segunda Classe",
            "Soldado de Primeira Classe",
            "Cabo"
          ]
        },
        {
          "titulo": "Graduados",
          "patentes": [
            "Terceiro-Sargento",
            "Segundo-Sargento",
            "Primeiro-Sargento",
            "Suboficial"
          ]
        },
        {
          "titulo": "Formação de oficiais",
          "patentes": [
            "Cadete",
            "Aspirante a Oficial"
          ]
        },
        {
          "titulo": "Oficiais",
          "patentes": [
            "Segundo-Tenente",
            "Primeiro-Tenente",
            "Capitão",
            "Major",
            "Tenente-Coronel",
            "Coronel"
          ]
        },
        {
          "titulo": "Oficiais-generais",
          "patentes": [
            "Comodoro do Ar",
            "Brigadeiro",
            "Major-Brigadeiro",
            "Tenente-Brigadeiro do Ar",
            "Marechal do Ar"
          ]
        }
      ]
    },
    "mb": {
      "nome": "Marinha Brasileira",
      "sigla": "MB",
      "imagem": "assets/forcas/mb.png",
      "descricao": "Força naval: navegação, fuzileiros navais, bases, instrução e apoio.",
      "fonte": "Hierarquia naval adaptada com Comodoro na progressão própria do jogo FAAAB.",
      "unidades": [
        "Corpo de Fuzileiros Navais",
        "Força de Submarinos",
        "Grupamento de Patrulha Naval",
        "Batalhão de Polícia Naval"
      ],
      "grupos": [
        {
          "titulo": "Ingresso e formação naval",
          "patentes": [
            "Aprendiz-Marinheiro",
            "Grumete",
            "Recruta Marinheiro"
          ]
        },
        {
          "titulo": "Praças",
          "patentes": [
            "Marinheiro",
            "Cabo"
          ]
        },
        {
          "titulo": "Graduados",
          "patentes": [
            "Terceiro-Sargento",
            "Segundo-Sargento",
            "Primeiro-Sargento",
            "Suboficial"
          ]
        },
        {
          "titulo": "Formação de oficiais",
          "patentes": [
            "Guarda-Marinha"
          ]
        },
        {
          "titulo": "Oficiais",
          "patentes": [
            "Segundo-Tenente",
            "Primeiro-Tenente",
            "Capitão-Tenente",
            "Capitão de Corveta",
            "Capitão de Fragata",
            "Capitão de Mar e Guerra"
          ]
        },
        {
          "titulo": "Almirantado",
          "patentes": [
            "Comodoro",
            "Contra-Almirante",
            "Vice-Almirante",
            "Almirante de Esquadra"
          ]
        }
      ]
    },
    "cbm": {
      "nome": "Corpo de Bombeiros Militar",
      "sigla": "CBM",
      "imagem": "assets/forcas/cbm.png",
      "descricao": "Resgate, salvamento, prevenção e resposta a emergências no jogo.",
      "fonte": "Estrutura básica das corporações estaduais, a ajustar à FAAAB.",
      "unidades": [
        "GSM",
        "Grupamento de Aviação"
      ],
      "grupos": [
        {
          "titulo": "Formação",
          "patentes": [
            "Aluno Bombeiro Militar"
          ]
        },
        {
          "titulo": "Praças",
          "patentes": [
            "Soldado",
            "Cabo"
          ]
        },
        {
          "titulo": "Graduados",
          "patentes": [
            "Terceiro-Sargento",
            "Segundo-Sargento",
            "Primeiro-Sargento",
            "Subtenente"
          ]
        },
        {
          "titulo": "Formação de oficiais",
          "patentes": [
            "Aspirante a Oficial"
          ]
        },
        {
          "titulo": "Oficiais",
          "patentes": [
            "Segundo-Tenente",
            "Primeiro-Tenente",
            "Capitão",
            "Major",
            "Tenente-Coronel",
            "Coronel"
          ]
        }
      ]
    },
    "pm": {
      "nome": "Polícia Militar",
      "sigla": "PM",
      "imagem": "assets/forcas/pm.png",
      "descricao": "Policiamento, patrulhamento, proteção e atendimento a ocorrências simuladas.",
      "fonte": "Patentes e etapas históricas da FAAAB; dias e cursos não confirmados permanecem sem valor.",
      "unidades": [
        "BOPE",
        "ROTAM",
        "BPChoque"
      ],
      "grupos": [
        {
          "titulo": "Ingresso",
          "patentes": [
            "Aprendiz"
          ]
        },
        {
          "titulo": "Praças",
          "patentes": [
            "Soldado de Segunda Classe",
            "Soldado",
            "Soldado de Primeira Classe",
            "Cabo"
          ]
        },
        {
          "titulo": "Graduados",
          "patentes": [
            "Terceiro-Sargento",
            "Segundo-Sargento",
            "Primeiro-Sargento",
            "Subtenente"
          ]
        },
        {
          "titulo": "Formação de oficiais",
          "patentes": [
            "Cadete",
            "Aspirante a Oficial"
          ]
        },
        {
          "titulo": "Oficiais",
          "patentes": [
            "Segundo-Tenente",
            "Primeiro-Tenente",
            "Capitão",
            "Major",
            "Tenente-Coronel",
            "Coronel"
          ]
        }
      ]
    }
  },
  "cursoObrigatorioPorPatente": {
    "eb": {
      "Recruta": "Formação de Soldados da brigada — Internato e Instrução Básica.",
      "Cabo": "ESA — Curso de Formação de Sargentos. Próxima etapa: 3º Sargento.",
      "Terceiro-Sargento": "Aperfeiçoamento de Sargentos I",
      "Segundo-Sargento": "Aperfeiçoamento de Sargentos II",
      "Primeiro-Sargento": "Curso de Altos Graduados",
      "Subtenente": "Admissão ao Oficialato",
      "Cadete": "Curso de Formação de Oficiais",
      "Aspirante a Oficial": "Exercício Final do Oficialato",
      "Capitão-Sênior": "EsAO — etapa de aperfeiçoamento de oficiais; ESG CPOG-EB.",
      "Soldado de Primeira Classe": "Curso de Formação de Cabos (CFC) + formação terrestre (CFSOT). Próxima etapa: Cabo.",
      "Primeiro-Tenente": "ESG — Curso de Operações Terrestres (COT-EB).",
      "Capitão": "EsAO — Escola de Aperfeiçoamento de Oficiais (CAO); ESG CGT-EB.",
      "Major": "ECEME — CP/CAEM.",
      "Tenente-Coronel": "ECEME — CAEM/CCEM.",
      "Coronel": "ECEME — CPEAEx, prepara a fase de General em Treinamento.",
      "General em Treinamento": "ECEME — conclusão do CPEAEx (etapa de formação).",
      "Soldado": "Curso de Formação de Soldado Especializado (CFSE) + CTA. Próxima etapa: Soldado de 1ª Classe."
    },
    "fab": {
      "Soldado de Segunda Classe": "CESD — Curso de Especialização de Soldados. Próxima etapa: Soldado de 1ª Classe.",
      "Soldado de Primeira Classe": "CFC — Curso de Formação de Cabos. Próxima etapa: Cabo.",
      "Cabo": "EEAR/CFS — Formação de Sargentos. Próxima etapa: 3º Sargento.",
      "Terceiro-Sargento": "Aperfeiçoamento de Sargentos I",
      "Segundo-Sargento": "Aperfeiçoamento de Sargentos II",
      "Primeiro-Sargento": "Curso de Aperfeiçoamento de Sargentos",
      "Suboficial": "Admissão à Formação de Oficiais",
      "Cadete": "Formação de Oficiais",
      "Aspirante a Oficial": "Exercício Final do Oficialato FAB",
      "Recruta": "CFSD — Curso de Formação de Soldados. Próxima etapa: Soldado de 2ª Classe.",
      "Capitão": "EAOAR — Aperfeiçoamento de Oficiais da Aeronáutica (CAP); ESG CGA-ESG.",
      "Primeiro-Tenente": "ESG — Curso de Operações Aéreas (COA)."
    },
    "mb": {
      "Grumete": "C-FMN — Curso de Formação de Marinheiros.",
      "Marinheiro": "Curso de Marinharia e qualificação de bordo, conforme função.",
      "Cabo": "Formação para 3º Sargento (C-Esp-HabSG).",
      "Primeiro-Sargento": "C-Esp-HabSO — habilitação para Suboficial.",
      "Primeiro-Tenente": "ESG — Curso de Operações Navais (CON).",
      "Capitão-Tenente": "ESG — Curso de Guerra Naval (CGN).",
      "Capitão de Corveta": "ESG — Planejamento de Operações Navais (CPON).",
      "Capitão de Fragata": "EGN — C-EMOS.",
      "Capitão de Mar e Guerra": "EGN — C-PEM.",
      "Aprendiz-Marinheiro": "Formação naval inicial; requisitos específicos sob definição da FAAAB.",
      "Recruta Marinheiro": "Etapa de formação naval da FAAAB; requisitos específicos sob definição."
    },
    "cbm": {
      "Aluno Bombeiro Militar": "Formação inicial CBM — CFP/CFSD.",
      "Cabo": "CEFC/CHC — qualificação para progressão.",
      "Terceiro-Sargento": "CFS/BM — formação de sargentos.",
      "Primeiro-Sargento": "CAS/BM — aperfeiçoamento de sargentos.",
      "Capitão": "CAO/BM — aperfeiçoamento de oficiais."
    }
  },
  "cursosOpcionaisPorForca": {
    "eb": [
      "Qualificações de brigada e batalhão (quando admitido)",
      "Formações de saúde operacional, paraquedismo ou especialidade (quando disponíveis)"
    ],
    "fab": [
      "Pilotagem (habilitação independente da patente)",
      "Controle Aéreo",
      "Resgate Aéreo",
      "Operações de Solo",
      "Instrutor FAB"
    ],
    "mb": [
      "Cursos e especializações navais conforme unidade",
      "Formações do Corpo de Fuzileiros Navais conforme seleção"
    ],
    "pm": [
      "Treinamentos de unidade após seleção e autorização"
    ],
    "cbm": [
      "Especializações de salvamento após seleção e autorização"
    ]
  },
  "contextoIngressos": {
    "eb": "CAS realiza exames e registra o candidato. Após aprovação, Sargento ou superior pode aceitar o civil, que ingressa no grupo e aguarda seleção aberta de brigada. Aprovado na brigada, passa a Recruta. A Formação de Soldados é organizada pela brigada, com Internato e Instrução Básica; a promoção não é automática.",
    "fab": "CAS examina e registra civis; Sargento ou superior pode aceitar o candidato para ingresso na FAB. As formações e seleções específicas após esse aceite ainda estão sendo definidas. A patente não substitui habilitação de pilotagem.",
    "mb": "CAS examina e registra civis; Sargento ou superior pode aceitar o candidato para ingresso na Marinha. O CFN integra a Marinha. A progressão e as seleções navais posteriores ao aceite precisam ser especificadas pela FAAAB.",
    "cbm": "O Corpo de Bombeiros Militar possui processo de ingresso próprio; o fluxo de recrutamento do CAS definido para EB, MB e FAB não deve ser aplicado automaticamente.",
    "pm": "A Polícia Militar possui processo de ingresso próprio; o fluxo de recrutamento do CAS definido para EB, MB e FAB não deve ser aplicado automaticamente."
  },
  "regrasDeAcesso": {
    "eb": {
      "Recruta": "Aprovação em seleção de brigada aberta e formação inicial vinculada à brigada. A participação nos batalhões não faz parte desta etapa.",
      "geral": "Lotação na brigada ou unidade indicada após formação e aceite. Cada batalhão possui critérios próprios de seleção, instrução e habilitação; o nível mínimo por batalhão ainda precisa ser aprovado."
    },
    "fab": {
      "geral": "Lotação em base, grupo ou unidade da FAB depende da formação e da seleção correspondente. Pilotagem é uma habilitação separada."
    },
    "mb": {
      "Recruta": "Etapa de formação naval; regras próprias de lotação permanecem sob definição.",
      "geral": "Lotação naval e ingresso no CFN ou unidades especiais seguem os processos específicos da Marinha. Critérios mínimos por unidade estão pendentes."
    },
    "pm": {
      "geral": "Lotação na Polícia Militar e ingresso em unidades de especialidade seguem critérios próprios ainda não consolidados nas fichas."
    },
    "cbm": {
      "geral": "Lotação no Corpo de Bombeiros e ingresso nos grupamentos dependem do processo de formação e de qualificações específicas."
    }
  },
  "regraCDP": "CDP concluída autoriza o próximo curso/treinamento ou exame; não gera promoção automática. Cargo de comando, lotação e qualificação são independentes da patente.",
  "diasPorPatente": {
    "eb": {
      "Soldado de Primeira Classe": 2,
      "Cabo": 3,
      "Terceiro-Sargento": 4,
      "Segundo-Sargento": 5,
      "Primeiro-Sargento": 6,
      "Subtenente": 7,
      "Aspirante a Oficial": 5,
      "Segundo-Tenente": 7,
      "Primeiro-Tenente": 8,
      "Capitão": 10,
      "Capitão-Sênior": 12,
      "Major": 14,
      "Tenente-Coronel": 16,
      "Coronel": 20,
      "General de Brigada": 22,
      "General de Divisão": 24,
      "General de Exército": 28,
      "Soldado": 1
    },
    "fab": {
      "Recruta": 1,
      "Soldado de Segunda Classe": 2,
      "Soldado de Primeira Classe": 3,
      "Cabo": 4,
      "Terceiro-Sargento": 5,
      "Segundo-Sargento": 7,
      "Primeiro-Sargento": 9,
      "Suboficial": 10,
      "Aspirante a Oficial": 4,
      "Segundo-Tenente": 6,
      "Primeiro-Tenente": 8,
      "Capitão": 10,
      "Major": 12,
      "Tenente-Coronel": 14,
      "Coronel": 16,
      "Brigadeiro": 18,
      "Tenente-Brigadeiro do Ar": 21,
      "Major-Brigadeiro": 24
    },
    "mb": {
      "Marinheiro": 2,
      "Cabo": 3,
      "Terceiro-Sargento": 4,
      "Segundo-Sargento": 5,
      "Primeiro-Sargento": 7,
      "Suboficial": 9,
      "Segundo-Tenente": 4,
      "Primeiro-Tenente": 6,
      "Capitão-Tenente": 8,
      "Capitão de Corveta": 10,
      "Capitão de Fragata": 12,
      "Capitão de Mar e Guerra": 15,
      "Contra-Almirante": 18,
      "Vice-Almirante": 22,
      "Almirante de Esquadra": 26
    },
    "cbm": {
      "Aluno Bombeiro Militar": 2,
      "Soldado": 3,
      "Cabo": 4,
      "Terceiro-Sargento": 5,
      "Segundo-Sargento": 6,
      "Primeiro-Sargento": 8,
      "Subtenente": 10,
      "Segundo-Tenente": 5,
      "Primeiro-Tenente": 7,
      "Capitão": 9,
      "Major": 12,
      "Tenente-Coronel": 15,
      "Coronel": 18
    },
    "pm": {}
  },
  "notaDias": "Valores recuperados do manual CDP da FAAAB, apresentados como referência de balanceamento. Não são aprovação de promoção automática."
};
