import unittest
from pathlib import Path
import sys
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import sincronizar_comandos as s


class TestComando(unittest.TestCase):
    def test_primeiro_e_mais_antigo(self):
        old = {"estado": "titular", "usuario_id": 10, "candidatos_desde": {
            "10": "2026-11-12T10:00:00+00:00"}}
        result = s.choose_oldest({"10", "20"}, old, "2026-11-15T10:00:00+00:00")
        self.assertEqual(result["usuario_id"], 10)

    def test_exonera_e_sobe_o_proximo(self):
        old = {"estado": "titular", "usuario_id": 10, "candidatos_desde": {
            "10": "2026-11-12T10:00:00+00:00", "20": "2026-11-13T10:00:00+00:00"}}
        result = s.choose_oldest({"20"}, old, "2026-11-15T10:00:00+00:00")
        self.assertEqual(result["usuario_id"], 20)
        self.assertNotIn("10", result["candidatos_desde"])

    def test_fila_por_ingresso_confirmado(self):
        old = {"estado": "aguardando_historico", "candidatos_desde": {
            "3": "2026-11-12T10:00:00+00:00", "4": "2026-11-13T10:00:00+00:00"}}
        self.assertEqual(s.choose_oldest({"3", "4"}, old, "2026-11-15T10:00:00+00:00")["usuario_id"], 3)

    def test_empate_sem_historico_nao_inventa(self):
        result = s.choose_oldest({"2", "3"}, {}, "2026-11-15T10:00:00+00:00")
        self.assertEqual(result["estado"], "aguardando_historico")

    def test_auditoria_desempata(self):
        result = s.choose_oldest({"2", "3"}, {}, "2026-11-15T10:00:00+00:00",
            {"2": "2026-11-14T10:00:00+00:00", "3": "2026-11-13T10:00:00+00:00"})
        self.assertEqual(result["usuario_id"], 3)

    def test_cargo_vago_substitui_titular(self):
        result = s.choose_oldest(set(), {"estado": "titular", "usuario_id": 14},
            "2026-11-15T10:00:00+00:00")
        self.assertEqual(result, {"estado": "vago", "candidatos_desde": {}})

    def test_paginas_pelo_cargo_ignorando_dono(self):
        seen = []
        def fake(url, key):
            self.assertEqual(key, "token-somente-em-memoria")
            q = parse_qs(urlparse(url).query)
            self.assertEqual(q["filter"], ["role == 'groups/5/roles/9'"])
            seen.append(q)
            if "pageToken" not in q:
                return {"groupMemberships": [{"user": "users/200", "role": "groups/5/roles/9"}],
                        "nextPageToken": "proxima"}
            return {"groupMemberships": [{"user": "users/300", "role": "groups/5/roles/9"}]}
        self.assertEqual(s.list_role_members(5, 9, "token-somente-em-memoria", fake), {"200", "300"})
        self.assertEqual(len(seen), 2)

    def test_role_estranho_e_falha_fechada(self):
        def fake(url, key):
            return {"groupMemberships": [{"user": "users/400", "role": "groups/5/roles/77"}]}
        with self.assertRaises(ValueError):
            s.list_role_members(5, 9, "chave", fake)

    def test_cursor_duplicado_nao_trava(self):
        def fake(url, key):
            return {"groupMemberships": [], "nextPageToken": "a"}
        with self.assertRaises(ValueError):
            s.list_role_members(5, 9, "chave", fake)

    def test_falha_conserva_ultimo_mas_marca_indisponivel(self):
        prior = {"grupo_id": 5, "estado": "titular", "usuario_id": 42,
                 "nome_usuario": "Exemplo", "verificado_em": "2026-11-13",
                 "candidatos_desde": {"42": "2026-11-12T10:00:00+00:00"}}
        def fail(url, key):
            raise OSError("rede")
        result = s.check_one_office(5, [9], "chave", prior, "2026-11-15", fail)
        self.assertEqual(result["estado"], "consulta_indisponivel")
        self.assertEqual(result["ultimo_confirmado"]["usuario_id"], 42)
        self.assertNotIn("usuario_id", result)

    def test_sem_chave_nao_finge_conexao(self):
        value = s.check_one_office(5, [9], "", {}, "2026-11-15")
        self.assertEqual(value["estado"], "consulta_indisponivel")
        self.assertEqual(value["motivo"], "sem_chave")

    def test_somente_cargo_configurado(self):
        cfg = {"forcas": {name: {"grupo_id": 5, "papeis_ids": [],
              "papeis_subcomando_ids": []} for name in s.FORCES}}
        result = s.sync(cfg, key="", now="2026-11-15T00:00:00+00:00")
        self.assertTrue(all(result["forcas"][name]["comandante"]["estado"] == "configuracao_pendente"
                            for name in s.FORCES))
        self.assertNotIn("chave", str(result))


if __name__ == "__main__":
    unittest.main()
