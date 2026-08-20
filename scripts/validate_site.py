#!/usr/bin/env python3
from __future__ import annotations
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    'index.html','styles.css','app.js','games-data.js','play.html','play.css','play.js',
    'guides.html','about.html','privacy.html','manifest.webmanifest','sw.js','robots.txt','sitemap.xml'
]
errors: list[str] = []

for relative in REQUIRED:
    if not (ROOT / relative).is_file():
        errors.append(f'필수 파일 없음: {relative}')

try:
    manifest = json.loads((ROOT / 'manifest.webmanifest').read_text(encoding='utf-8'))
    if manifest.get('start_url') != '/?source=pwa':
        errors.append('manifest start_url 확인 필요')
except Exception as exc:
    errors.append(f'manifest JSON 오류: {exc}')

text = (ROOT / 'games-data.js').read_text(encoding='utf-8')
match = re.search(r'window\.HP_GAMES\s*=\s*(\[.*\])\s*;\s*$', text, re.S)
if not match:
    errors.append('games-data.js 형식을 읽지 못함')
    games = []
else:
    try:
        games = json.loads(match.group(1))
    except Exception as exc:
        errors.append(f'게임 데이터 JSON 오류: {exc}')
        games = []

ids: set[str] = set()
for game in games:
    game_id = game.get('id')
    if not game_id or game_id in ids:
        errors.append(f'게임 ID 누락 또는 중복: {game_id!r}')
    ids.add(game_id)
    for key in ('title','path','image','category','description'):
        if not game.get(key):
            errors.append(f'{game_id}: {key} 누락')
    if game.get('path') and not (ROOT / game['path']).is_file():
        errors.append(f'{game_id}: 기존 게임 파일 없음: {game["path"]}')
    if game.get('image') and not (ROOT / game['image']).is_file():
        errors.append(f'{game_id}: 썸네일 파일 없음: {game["image"]}')

class BasicHTMLParser(HTMLParser):
    pass

for html_path in ROOT.glob('*.html'):
    source = html_path.read_text(encoding='utf-8', errors='replace')
    if '<html' not in source.lower() or '</html>' not in source.lower():
        errors.append(f'HTML 루트 태그 이상: {html_path.name}')
    try:
        BasicHTMLParser().feed(source)
    except Exception as exc:
        errors.append(f'HTML 파싱 오류 {html_path.name}: {exc}')

if len(games) != 14:
    errors.append(f'게임 수 확인 필요: {len(games)}개')

if errors:
    print('사이트 검증 실패:')
    for error in errors:
        print(f' - {error}')
    sys.exit(1)

print(f'사이트 검증 성공: 필수 파일 {len(REQUIRED)}개, 게임 {len(games)}개')
