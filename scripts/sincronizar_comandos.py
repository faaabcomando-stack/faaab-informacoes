#!/usr/bin/env python3
"""FAAAB: lê ocupantes dos grupos via Roblox Open Cloud e cria JSON público.

A chave fica SOMENTE no ambiente de GitHub Actions. A página pública
consome o resultado SEM chave. Não modifica cargos ou avatares Roblox.

"Primeiro comandante" = quem entrou primeiro no cargo entre os elegíveis,
conforme histórico do grupo, ou primeiro ingresso comprovado em consultas
anteriores. No primeiro levantamento com vários usuários sem histórico,
não sorteia nem escolhe pelo ID.
"""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "data/titulares.json"
DEFAULT_OUTPUT = ROOT / "assets/comando/titulares.json"
PRIOR_URL = "https://faaabcomando-stack.github.io/faaab-informacoes/assets/comando/titulares.json"
FORCES = ("eb", "fab", "mb", "cbm", "pm")
OFFICES = {"comandante": "papeis_ids", "subcomandante": "papeis_subcomando_ids"}
USER = re.compile(r"users/([1-9][0-9]*)\Z")


def fetch_json(url, key=None, timeout=12):
    if not url.startswith("https://"):
        raise ValueError("HTTPS obrigatório")
    request = Request(url, headers={
        "Accept": "application/json",
        "User-Agent": "FAAAB-PublicCommandSync/1.0",
        **({"x-api-key": key} if key else {}),
    })
    with urlopen(request, timeout=timeout) as response:
        data = response.read(5_000_001)
    if len(data) > 5_000_000:
        raise ValueError("JSON de resposta muito grande")
    return json.loads(data)


def list_role_members(group_id, role_id, key, request=fetch_json):
    """Paginado e filtrado PELO cargo, nunca escolhe dono do grupo por acaso."""
    path = f"https://apis.roblox.com/cloud/v2/groups/{group_id}/memberships"
    query = {"maxPageSize": 100, "filter": f"role == 'groups/{group_id}/roles/{role_id}'"}
    seen_pages = set()
    users = set()
    while True:
        url = path + "?" + urlencode(query)
        response = request(url, key)
        members = response.get("groupMemberships")
        if not isinstance(members, list):
            raise ValueError("Resposta de memberships incompleta")
        for member in members:
            if not isinstance(member, dict):
                raise ValueError("Membro inválido")
            # Mesmo usando filtro, a resposta nunca deve contradizer o cargo.
            current = member.get("roles") or ([member["role"]] if member.get("role") else [])
            wanted = f"groups/{group_id}/roles/{role_id}"
            if current and wanted not in current:
                raise ValueError("Resposta não corresponde ao cargo solicitado")
            match = USER.fullmatch(str(member.get("user", "")))
            if not match:
                raise ValueError("ID de usuário inválido")
            users.add(match.group(1))
        cursor = response.get("nextPageToken")
        if not cursor:
            return users
        if cursor in seen_pages or len(seen_pages) >= 500:
            raise ValueError("Paginação de cargos repetida ou excessiva")
        seen_pages.add(cursor)
        query["pageToken"] = cursor


def eligible_users(group_id, role_ids, key, request=fetch_json):
    users = set()
    for role_id in role_ids:
        users.update(list_role_members(group_id, role_id, key, request))
    return users


def valid_previous(prior, group_id):
    return prior if isinstance(prior, dict) and prior.get("grupo_id") == group_id else {}


def choose_oldest(candidates, previous, now, audit_dates=None):
    """Não escolhe arbitrariamente entre dois ingressos simultâneos."""
    candidates = set(candidates)
    prior_since = previous.get("candidatos_desde") or {}
    since = {u: prior_since.get(u, now) for u in candidates}
    if not candidates:
        return {"estado": "vago", "candidatos_desde": {}}
    selected = None
    origin = "consulta"
    if len(candidates) == 1:
        selected = next(iter(candidates))
    elif audit_dates and all(u in audit_dates for u in candidates):
        ordered = sorted(candidates, key=lambda u: audit_dates[u])
        if audit_dates[ordered[0]] < audit_dates[ordered[1]]:
            selected = ordered[0]
            origin = "historico_roblox"
    if selected is None:
        prior_selected = str(previous.get("usuario_id") or "")
        if previous.get("estado") == "titular" and prior_selected in candidates:
            selected = prior_selected
            origin = "titular_confirmado"
    if selected is None:
        times = sorted(set(since.values()))
        if len(times) > 1:
            earliest = [u for u in candidates if since[u] == times[0]]
            if len(earliest) == 1:
                selected = earliest[0]
                origin = "primeira_observacao"
    if selected is None:
        return {"estado": "aguardando_historico", "elegiveis": len(candidates),
                "candidatos_desde": since}
    return {"estado": "titular", "usuario_id": int(selected),
            "elegiveis": len(candidates), "criterio": origin,
            "candidatos_desde": since}


def audit_start_times(group, users, role_ids, key):
    """Opcional: usa auditoria para desempatar, sem exigir chave com escrita."""
    if not key or len(users) < 2:
        return {}
    # Reutiliza o leitor do Codex; somente ações ChangeRank.
    try:
        from consultar_comando import audit, audit_members_since
        starts = audit_members_since(users, role_ids, audit(group, key))
        return {str(u): t.isoformat() for u, t in starts.items()}
    except (ValueError, OSError, KeyError, TypeError):
        return {}


def public_profile(user_id, request=fetch_json):
    """Avatar atual do jogador, NÃO avatar vestido com farda da FAAAB."""
    uid = int(user_id)
    result = {"usuario_id": uid, "perfil_url": f"https://www.roblox.com/users/{uid}/profile"}
    try:
        data = request(f"https://users.roblox.com/v1/users/{uid}")
        if isinstance(data.get("name"), str) and data["name"].strip():
            result["nome_usuario"] = data["name"][:60]
        if isinstance(data.get("displayName"), str) and data["displayName"].strip():
            result["nome_exibicao"] = data["displayName"][:60]
    except (ValueError, OSError, KeyError, TypeError):
        pass
    try:
        params = urlencode({"userIds": uid, "size": "720x720", "format": "Png", "isCircular": "false"})
        data = request(f"https://thumbnails.roblox.com/v1/users/avatar?{params}")
        rec = (data.get("data") or [{}])[0]
        url = rec.get("imageUrl")
        host = urlparse(url or "").hostname or ""
        if rec.get("state") == "Completed" and isinstance(url, str) and url.startswith("https://") and (
            host == "rbxcdn.com" or host.endswith(".rbxcdn.com")
        ):
            result["avatar_url"] = url
    except (ValueError, OSError, KeyError, TypeError, IndexError):
        pass
    return result


def check_one_office(group, roles, key, previous, now, request=fetch_json, audit_key=""):
    if not group or not roles:
        return {"estado": "configuracao_pendente", "grupo_id": group}
    old = valid_previous(previous, group)
    if not key:
        return unavailable(old, group, "sem_chave")
    try:
        candidates = eligible_users(group, roles, key, request)
    except (ValueError, OSError, HTTPError, URLError):
        return unavailable(old, group, "consulta_indisponivel")
    starts = audit_start_times(group, candidates, roles, audit_key) if len(candidates) > 1 else {}
    result = choose_oldest(candidates, old, now, starts)
    result["grupo_id"] = group
    result["verificado_em"] = now
    if result["estado"] == "titular":
        user_id = result["usuario_id"]
        profile = public_profile(user_id, request)
        old_person = old if old.get("estado") == "titular" else old.get("ultimo_confirmado", {})
        if old_person.get("usuario_id") == user_id:
            for field in ("nome_usuario", "nome_exibicao", "avatar_url"):
                if field not in profile and field in old_person:
                    profile[field] = old_person[field]
        result.update(profile)
    return result


def unavailable(previous, group, reason):
    # Nunca afirma que o cargo continua ocupado sem nova consulta.
    keep = {"estado": "consulta_indisponivel", "motivo": reason, "grupo_id": group}
    previous_person = previous if previous.get("estado") == "titular" else (
        previous.get("ultimo_confirmado") if previous.get("estado") == "consulta_indisponivel" else None)
    if isinstance(previous_person, dict) and previous_person.get("usuario_id"):
        keep["ultimo_confirmado"] = {k: previous_person[k] for k in
            ("usuario_id", "nome_usuario", "nome_exibicao", "avatar_url", "perfil_url", "verificado_em")
            if k in previous_person}
    if isinstance(previous.get("candidatos_desde"), dict):
        keep["candidatos_desde"] = previous["candidatos_desde"]
    return keep


def sync(config, previous=None, key="", audit_key="", request=fetch_json, now=None):
    now = now or datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    prev_forces = (previous or {}).get("forcas") or {}
    data = {"versao": 1, "gerado_em": now, "fonte": "Roblox Open Cloud", "forcas": {}}
    for force in FORCES:
        settings = config["forcas"][force]
        group = settings.get("grupo_id")
        old_force = prev_forces.get(force) or {}
        data["forcas"][force] = {}
        # Um erro num cargo não impede atualização dos outros.
        for office, field in OFFICES.items():
            old = old_force.get(office) or {}
            data["forcas"][force][office] = check_one_office(
                group, settings.get(field) or [], key, old, now, request, audit_key)
        # Reduz chance de diagnóstico incorreto: só publica estados, nunca chave.
        print(f"{force}: " + ", ".join(
            f"{office}={data['forcas'][force][office]['estado']}" for office in OFFICES))
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    key = os.environ.get("ROBLOX_OPEN_CLOUD_KEY", "").strip()
    audit_key = os.environ.get("ROBLOX_GROUP_AUDIT_KEY", "").strip()
    print("Chave Roblox presente no ambiente: " + ("sim" if key else "não"))
    print("Chave de auditoria presente no ambiente: " + ("sim" if audit_key else "não"))
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    try:
        previous = fetch_json(PRIOR_URL, timeout=7)
        if previous.get("versao") != 1:
            previous = {}
    except (ValueError, OSError, HTTPError, URLError):
        previous = {}
    data = sync(config, previous, key, audit_key)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Arquivo JSON público gerado; segredos não foram gravados.")


if __name__ == "__main__":
    main()
