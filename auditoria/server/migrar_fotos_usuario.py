#!/usr/bin/env python3
"""Migra fotos da pasta data\\photos\\Usuario para o formato usado pelo app.

Estratégia de matching (para cada arquivo em Usuario\\):
  1. Normaliza o nome do arquivo (sem extensão, minúsculo, sem espaços)
  2. Compara com o `user` (login) e `name` (display) de cada usuário do DB
  3. Se casar, copia para data\\photos\\<login>.jpg
"""

import re, shutil, sqlite3, sys
from pathlib import Path

BASE       = Path(__file__).parent
DB         = BASE / 'data' / 'toyinps.db'
PHOTOS_DIR = BASE / 'data' / 'photos'
SOURCE_DIR = PHOTOS_DIR / 'Usuario'

def norm(s):
    """abcdef, ignorando espaços/pontuação/case."""
    return re.sub(r'[^a-z0-9]', '', (s or '').lower())

def main():
    if not SOURCE_DIR.is_dir():
        print(f'[ERRO] Pasta nao encontrada: {SOURCE_DIR}')
        return 1
    if not DB.is_file():
        print(f'[ERRO] Banco nao encontrado: {DB}')
        return 1

    con = sqlite3.connect(str(DB))
    con.row_factory = sqlite3.Row
    users = [dict(r) for r in con.execute('SELECT user,name FROM users').fetchall()]
    con.close()

    print(f'\n{len(users)} usuario(s) no banco. Vasculhando {SOURCE_DIR}...\n')

    files = sorted(f for f in SOURCE_DIR.iterdir()
                   if f.is_file() and f.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp'))
    if not files:
        print('Nenhuma foto na pasta Usuario\\. Nada para fazer.')
        return 0

    ok, skip, ambig = 0, 0, 0

    for f in files:
        stem = f.stem  # nome sem extensão
        n    = norm(stem)
        candidates = []
        for u in users:
            if norm(u['user']) == n or norm(u['name']) == n:
                candidates.append(u)
        # fallback: primeira palavra do nome do arquivo casa com login
        if not candidates:
            first = norm(stem.split()[0]) if stem.split() else ''
            for u in users:
                if first and norm(u['user']) == first:
                    candidates.append(u)

        if len(candidates) == 1:
            login = candidates[0]['user']
            safe  = re.sub(r'[^A-Za-z0-9_-]', '_', login)
            dest  = PHOTOS_DIR / f'{safe}.jpg'
            try:
                shutil.copyfile(f, dest)
                print(f'  [OK]      {f.name:35s} -> {dest.name}   ({candidates[0]["name"]})')
                ok += 1
            except Exception as e:
                print(f'  [FALHOU]  {f.name}: {e}')
        elif len(candidates) > 1:
            names = ', '.join(u['user'] for u in candidates)
            print(f'  [AMBIGUO] {f.name:35s} -> combina com: {names}. Pulado.')
            ambig += 1
        else:
            print(f'  [SEM MATCH] {f.name:35s} -> nao encontrei usuario no app.')
            skip += 1

    print(f'\n{"="*50}')
    print(f'  Copiados: {ok}   Sem match: {skip}   Ambiguos: {ambig}')
    print(f'{"="*50}\n')

    if ok:
        print('AGORA: reinicie o servidor (feche a janela preta e rode iniciar.bat)')
        print('para que ele registre o hasPhoto=true dos usuarios que ganharam foto.')
        print('Depois, faca Ctrl+F5 no browser.\n')
    return 0

if __name__ == '__main__':
    sys.exit(main())
