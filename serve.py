#!/usr/bin/env python3
"""Servidor de desenvolvimento local com cache desabilitado.

Evita o problema de 'editei o arquivo mas o navegador mostra a versão antiga':
envia Cache-Control: no-store em todas as respostas.

Uso: python serve.py [porta]
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_header(self, keyword, value):
        # Remove cabeçalhos de validação que permitem respostas 304 (cache antigo)
        if keyword.lower() in ("last-modified", "etag"):
            return
        super().send_header(keyword, value)

    def log_message(self, fmt, *args):
        pass  # silencioso


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    handler = partial(NoCacheHandler, directory=".")
    with ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        print(f"Servindo em http://localhost:{port} (cache desabilitado)")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
