"""Reproducible Korean localization of upstream 0720ddfe; no network requests."""
from pathlib import Path
import json, re, shutil, sys
UPSTREAM = '0720ddfe37334628bab61ba5b3a9282bd6bfb31c'
D = json.loads(Path(__file__).with_name('ko.json').read_text(encoding='utf-8'))
PATTERN = re.compile('|'.join(re.escape(k) for k in sorted(D, key=len, reverse=True)))
def translate(text):
    return PATTERN.sub(lambda m: D[m.group()], text)
def build(source, target):
    source, target = Path(source), Path(target)
    target.mkdir(parents=True, exist_ok=True)
    for folder in ['app', 'tests']:
        shutil.copytree(source/folder, target/folder, dirs_exist_ok=True)
    shutil.rmtree(target/'app/fonts', ignore_errors=True)
    for p in target.rglob('*'):
        if p.suffix not in {'.js','.mjs','.html','.css','.svg'}: continue
        s = p.read_text(encoding='utf-8')
        if p.name == 'index.html':
            s = s.replace('<i data-c="ド">ド</i><i data-c="パ">パ</i>', '<i data-c="도">도</i><i data-c="파">파</i>')
            s = s.replace('<i>ド</i><i>リ</i><i>ル</i>', '<i>드</i><i>릴</i>')
            for a,b in zip('日月火水木金土','일월화수목금토'):
                s=s.replace(f'<span>{a}</span>',f'<span>{b}</span>')
            s=s.replace('lang="ja"','lang="ko"')
        if p.name == 'problems.js' or p.suffix == '.mjs':
            patches = {
              "{ n: total }, { w: 'は' }, { n: a }, { w: 'と' }": "{ n: total }, { op: '＝' }, { n: a }, { op: '＋' }",
              '${total}は${a}と': '${total} = ${a} + ?',
              '${a}に いくつで ${total}': '${a}에 얼마를 더하면 ${total}일까요?',
              '${x}に ${10 - (x % 10)}で 10': '${x}에 ${10 - (x % 10)}을 더하면 10',
              '${cur}の中に${d}はいくつ': '${cur} 안에 ${d}이(가) 몇 번 들어갈까요?',
              '${q * d}を ${d}つに わける': '${q * d}을(를) ${d}등분해요',
              "'こたえ'": "'답'", "'商'": "'몫'", "title: 'ひ'": "title: '비'",
              "{ w: 'の' }": "{ w: '의' }", "{ w: 'は' }": "{ op: '＝' }", "{ w: 'と' }": "{ w: '와' }", "{ w: 'を' }": "{ w: '을' }",
              '${a}と${b}の${w}': '${a}와 ${b}의 ${w}',
              '${Math.floor(n / d)}と${n % d}/${d}': '${Math.floor(n / d)} ${n % d}/${d}',
              '${w1}と${n1}/${d}': '${w1} ${n1}/${d}', '${w2}と${n2}/${d}': '${w2} ${n2}/${d}',
              '${Math.floor(res / d)}と${res % d}/${d}': '${Math.floor(res / d)} ${res % d}/${d}',
              '${q * d}の1/${d}': '${q * d}의 1/${d}', '${base}の${p}%': '${base}의 ${p}%',
              '${n}を${nm}': '${n}을(를) ${nm}',
              'たす（': '더하기 (', '${PLACE[i]}）': '${PLACE[i]})',
              ' と ${D % 10}': '와 ${D % 10}', "['一', '十', '百']": "['일', '십', '백']",
            }
            for a,b in patches.items():s=s.replace(a,b)
        if p.name == 'app_generators.test.mjs':
            s=s.replace(r'.replace(/と/,', r'.replace(/ /,').replace(r'(?:(\d+)と)?', r'(?:(\d+) )?')
        s=s.replace(".join('と')", ".join(' · ')")
        s=s.replace('${sk.grade}年','${sk.grade}학년')
        s=s.replace('第${S.qi + 1}問','${S.qi + 1}번 문제').replace('第1問','1번 문제')
        s=s.replace("'正'", "'정'")
        s=translate(s).replace('（', '(').replace('）', ')')
        # All versions and reset operations use this fork's namespace only.
        s=s.replace('ja-JP','ko-KR').replace('dopa-drill','dopa-drill-ko')
        if p.name=='style.css':
            s=re.sub(r'@font-face\s*\{[^}]*\}', '', s)
            s=re.sub(r'--round:[^;]+;', '--round: "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", system-ui, sans-serif;',s)
            s=re.sub(r'--chunky:[^;]+;', '--chunky: var(--round);',s)
            s += '\n/* Korean typography: no external font download required. */\n.logo {font-weight: 900;}\n.logo-ribbon {font-weight: 900;}\n.ko-credit {font-size: 11px; line-height: 1.6; text-align:center; opacity:.78; max-width:100%; margin:0;}\n.ko-credit a {color:inherit;}\n.grade-note {font-size:11px;}\n'
        if p.name=='index.html':
            s=s.replace('<title>도파드릴</title>','<title>도파드릴 | 비공식 한국어판</title>')
            marker='<p class="hint">숫자 키와 Backspace로도 입력할 수 있어요</p>'
            assert marker in s
            s=s.replace(marker,marker+'\n      <p class="ko-credit">비공식·비영리 한국어판 · 원작 © gear_machine<br><a href="https://github.com/grmchn/dopa-drill" target="_blank" rel="noopener noreferrer">원작</a> · <a href="LICENSE" target="_blank">이용 조건</a><br><span class="grade-note">학년 구분은 원작 기준이며 한국 교과과정과 다를 수 있어요.</span></p>')
        if p.name=='main.js':
            s=s.replace('Dela Gothic One, sans-serif', 'Malgun Gothic, Apple SD Gothic Neo, sans-serif')
        p.write_text(s,encoding='utf-8')
    shutil.copy2(source/'LICENSE',target/'app/LICENSE')
    (target/'app/.nojekyll').write_text('')
    (target/'app/VERSION.json').write_text(json.dumps({'upstream':'grmchn/dopa-drill','commit':UPSTREAM,'locale':'ko-KR','unofficial':True},ensure_ascii=False,indent=2)+'\n')
    (target/'app/README.md').write_text('''# 도파드릴 — 비공식 한국어판

원작: [grmchn/dopa-drill](https://github.com/grmchn/dopa-drill) · © 2026 gear_machine

[바로 플레이](https://dalmook.github.io/dopa-drill/)

문제를 풀수록 음악과 애니메이션이 신나는 수학 게임입니다. 원작의 계산 엔진, 58개 학습 주제, 학습 지도, 복습, 오늘의 미션, 트로피, 컬렉션, 출석 기록을 유지했습니다. 학년 구분은 원작의 일본 교육과정 기준이며 한국 교육과정과 동일하지 않습니다.

## 플레이
첫 화면의 **내 수준에 맞게**를 누르거나 학년을 선택하세요. 빛나는 칸에 숫자를 입력합니다. 세로셈은 단계별로 입력하며, 숫자를 입력하면 자동으로 판정합니다. PC 숫자 키와 Backspace, 모바일 숫자판을 지원합니다. 설정에서 문제 수, 소리, 움직임 강도를 바꿀 수 있습니다.

기록은 이 브라우저의 localStorage(`dopa-drill-ko:v1`)에만 저장됩니다. 다른 브라우저·기기와 동기화되지 않습니다. 광고·로그인·외부 분석기를 추가하지 않았습니다. 한국어 시스템 글꼴을 사용하므로 외부 글꼴 다운로드가 필요 없습니다.

## 실행 및 재빌드
이 폴더를 정적 웹 서버로 서비스합니다. `python3 -m http.server 8000` 실행 후 브라우저에서 접속하세요. ES Modules를 사용하므로 `file://`로 직접 열지 마세요.

재현 가능한 번역 사전과 빌드 스크립트는 저장소의 `tools/dopa-drill/`에 있습니다. 원작 커밋은 `VERSION.json`에 고정되어 있습니다.

## 라이선스
소스 코드는 MIT입니다. 도파키치 캐릭터와 도파드릴 이름·로고에는 별도 비영리 이용 조건이 적용됩니다. 이 버전은 원작자가 운영하는 공식 서비스가 아닌 비공식·비영리 한국어 번역판입니다. 상업적 이용 전 원작자의 허가가 필요합니다. 자세한 원문은 [LICENSE](LICENSE)를 확인하세요.
''',encoding='utf-8')
    print(f'Korean build: {len(D)} translations, upstream {UPSTREAM}')
if __name__=='__main__':
    if len(sys.argv)!=3: raise SystemExit('Usage: python build.py UPSTREAM_DIR OUTPUT_DIR')
    build(sys.argv[1],sys.argv[2])
