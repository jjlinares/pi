#!/usr/bin/env python3
"""Query Plex servers available to the account in PLEX_TOKEN."""

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

CLIENT_ID = "pi-plex-skill"
RESOURCES_URL = "https://clients.plex.tv/api/v2/resources?includeHttps=1&includeRelay=1"
LOCAL_URL = "http://127.0.0.1:32400"


def request(url, token, timeout=10):
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "X-Plex-Client-Identifier": CLIENT_ID,
            "X-Plex-Product": "pi",
            "X-Plex-Token": token,
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        body = response.read()
    return json.loads(body) if body else {}


def account_token():
    token = os.environ.get("PLEX_TOKEN")
    if not token:
        sys.exit("PLEX_TOKEN is not set. Source ~/.config/shell/env.local.")
    return token


def servers(token):
    resources = request(RESOURCES_URL, token)
    return [r for r in resources if "server" in r.get("provides", "").split(",")]


def select_servers(token, name):
    found = servers(token)
    if name:
        found = [s for s in found if s["name"].lower() == name.lower()]
        if not found:
            sys.exit(f"No accessible Plex server named {name!r}.")
    return found


def is_this_machine(server):
    try:
        identity = request(LOCAL_URL + "/identity", server["accessToken"], timeout=2)
    except (OSError, urllib.error.URLError, json.JSONDecodeError):
        return False
    return identity.get("MediaContainer", {}).get("machineIdentifier") == server.get("clientIdentifier")


def connect(server, path):
    errors = []
    connections = sorted(server.get("connections", []), key=lambda c: (c.get("relay", False), not c.get("local", False)))
    uris = [c["uri"] for c in connections]
    if is_this_machine(server):
        uris.insert(0, LOCAL_URL)
    for uri in uris:
        try:
            return request(uri + path, server["accessToken"], timeout=5)
        except (OSError, urllib.error.URLError, json.JSONDecodeError) as error:
            errors.append(f"{uri}: {error}")
    raise RuntimeError("; ".join(errors) or "no connections")


def item_summary(item):
    keys = ["type", "title", "year", "grandparentTitle", "parentTitle", "index", "parentIndex", "librarySectionTitle", "ratingKey", "key"]
    return {key: item[key] for key in keys if key in item}


def search(args, token):
    query = urllib.parse.urlencode({"query": args.query, "limit": args.limit})
    results = []
    for server in select_servers(token, args.server):
        entry = {"server": server["name"], "owner": server.get("sourceTitle") or "me", "items": []}
        try:
            data = connect(server, f"/hubs/search?{query}")
        except RuntimeError as error:
            entry["error"] = str(error)
            results.append(entry)
            continue
        for hub in data.get("MediaContainer", {}).get("Hub", []):
            for item in hub.get("Metadata", []):
                if not args.type or item.get("type") == args.type:
                    entry["items"].append(item_summary(item))
        results.append(entry)
    print(json.dumps(results, indent=2))


def list_servers(args, token):
    output = [
        {
            "name": server["name"],
            "owner": server.get("sourceTitle") or "me",
            "owned": server.get("owned"),
            "online": server.get("presence"),
            "connections": len(server.get("connections", [])),
        }
        for server in servers(token)
    ]
    print(json.dumps(output, indent=2))


def get(args, token):
    if not args.path.startswith("/"):
        sys.exit("PATH must start with /.")
    server = select_servers(token, args.server)[0]
    print(json.dumps(connect(server, args.path), indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(required=True)

    servers_parser = commands.add_parser("servers", help="list accessible servers")
    servers_parser.set_defaults(run=list_servers)

    search_parser = commands.add_parser("search", help="search all or one server")
    search_parser.add_argument("query")
    search_parser.add_argument("--server", help="exact server name")
    search_parser.add_argument("--type", help="Plex type, such as movie, show, episode, or artist")
    search_parser.add_argument("--limit", type=int, default=10, help="results per hub")
    search_parser.set_defaults(run=search)

    get_parser = commands.add_parser("get", help="read a server API path")
    get_parser.add_argument("path", help="API path, such as /library/sections")
    get_parser.add_argument("--server", required=True, help="exact server name")
    get_parser.set_defaults(run=get)

    args = parser.parse_args()
    try:
        args.run(args, account_token())
    except urllib.error.HTTPError as error:
        sys.exit(f"Plex API error: HTTP {error.code}")


if __name__ == "__main__":
    main()
