"""Consulta titulares e suplência no Roblox e imprime um resumo JSON.

ROBLOX_OPEN_CLOUD_KEY autentica a lista de membros. Para ordenar cargos com
mais de um ocupante, ROBLOX_GROUP_AUDIT_KEY dá acesso à auditoria do grupo.
"""
import argparse
from datetime import datetime
from http.client import HTTPException
import json
import os
from pathlib import Path
import re
from urllib.parse import urlencode
from urllib.request import HTTPRedirectHandler, Request, build_opener


CONFIG = Path(__file__).resolve().parents[1] / "data/titulares.json"


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def get(path, key, **params):
    url = f"https://apis.roblox.com{path}?{urlencode(params)}"
    request = Request(url, headers={"x-api-key": key, "Accept": "application/json"})
    with build_opener(NoRedirect).open(request, timeout=18) as response:
        return json.load(response)


def pages(path, key, item_field, request_cursor, response_cursor, **params):
    seen = set()
    while True:
        response = get(path, key, **params)
        items = response.get(item_field)
        if not isinstance(items, list):
            raise ValueError(f"Lista ausente na resposta: {item_field}")
        yield from items
        cursor = response.get(response_cursor)
        if not cursor:
            return
        if cursor in seen:
            raise ValueError("Cursor repetido")
        seen.add(cursor)
        params[request_cursor] = cursor


def memberships(group, key):
    return pages(
        f"/cloud/v2/groups/{group}/memberships", key,
        "groupMemberships", "pageToken", "nextPageToken", maxPageSize=100
    )


def audit(group, key):
    return pages(
        f"/legacy-groups/v1/groups/{group}/audit-log", key,
        "data", "cursor", "nextPageCursor", actionType="ChangeRank", sortOrder="Desc", limit=100
    )


def audit_members_since(candidates, role_ids, entries):
    remaining = set(candidates)
    starts = {}
    wanted = {str(role_id) for role_id in role_ids}
    for entry in entries:
        detail = entry.get("description")
        if not isinstance(detail, dict):
            continue
        target = str(detail.get("TargetId"))
        old_role = str(detail.get("OldRoleSetId"))
        new_role = str(detail.get("NewRoleSetId"))
        if target not in remaining or (old_role in wanted) == (new_role in wanted):
            continue
        remaining.remove(target)
        if new_role in wanted and entry.get("created"):
            starts[target] = datetime.fromisoformat(entry["created"])
        if not remaining:
            break
    return starts


def choose(candidates, starts):
    if not candidates:
        return {"estado": "vago"}
    if len(candidates) == 1:
        winner = next(iter(candidates))
    else:
        if set(starts) != set(candidates):
            return {"estado": "aguardando_historico", "ocupantes": len(candidates)}
        oldest = min(starts.values())
        winners = [candidate for candidate, start in starts.items() if start == oldest]
        if len(winners) > 1:
            return {"estado": "ordem_indeterminada", "ocupantes": len(candidates)}
        winner = winners[0]
    result = {"estado": "titular", "usuario_id": int(winner)}
    if winner in starts:
        result["no_cargo_desde"] = starts[winner].isoformat()
    return result


def check_role(group, roles, members, audit_key):
    if not roles:
        return {"estado": "configuracao_pendente"}
    wanted = {f"groups/{group}/roles/{role_id}" for role_id in roles}
    candidates = set()
    for member in members:
        current = member.get("roles") or [member.get("role")]
        if wanted.intersection(current):
            match = re.fullmatch(r"users/([1-9]\d*)", member.get("user") or "")
            if not match:
                raise ValueError("Formato de usuário inválido na resposta")
            candidates.add(match[1])
    starts = {}
    if len(candidates) > 1 and audit_key:
        starts = audit_members_since(candidates, roles, audit(group, audit_key))
    return choose(candidates, starts)


def collect(config, key, audit_key):
    result = {}
    for force, settings in config["forcas"].items():
        group = settings["grupo_id"]
        offices = {
            "comandante": settings["papeis_ids"],
            "subcomandante": settings["papeis_subcomando_ids"]
        }
        result[force] = {}
        if not group or not any(offices.values()):
            result[force] = {office: {"estado": "configuracao_pendente"} for office in offices}
            continue
        try:
            members = list(memberships(group, key))
        except (OSError, ValueError, HTTPException) as error:
            result[force] = {
                office: {"estado": "consulta_indisponivel", "http": getattr(error, "code", None)}
                for office in offices
            }
            continue
        for office, roles in offices.items():
            try:
                result[force][office] = check_role(group, roles, members, audit_key)
            except (OSError, ValueError, HTTPException) as error:
                result[force][office] = {
                    "estado": "consulta_indisponivel", "http": getattr(error, "code", None)
                }
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--arquivo-chave", type=Path, help="caminho de uma chave local para listar membros")
    args = parser.parse_args()
    key = args.arquivo_chave.read_text(encoding="utf-8-sig").strip() if args.arquivo_chave else os.environ.get("ROBLOX_OPEN_CLOUD_KEY", "")
    if not key:
        parser.error("Informe a chave para consultar membros dos grupos")
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    snapshot = collect(config, key, os.environ.get("ROBLOX_GROUP_AUDIT_KEY"))
    print(json.dumps({"forcas": snapshot}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
