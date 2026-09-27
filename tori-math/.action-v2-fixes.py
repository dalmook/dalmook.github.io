from pathlib import Path
import re
root=Path(__file__).resolve().parent
css=root/'action.css'
text=css.read_text()
text+='\n/* Override legacy phone sizing and keep every control reachable. */\n.action-v2 body.playing .arena-panel,.action-v2 body.playing .arena-panel canvas{height:100%;min-height:0;max-height:none}\n.action-v2 .topbar{z-index:32}\n.action-v2 body.playing .topbar{display:flex}\n.action-v2 .arena-hud>div:first-child{width:100%}\n.action-v2 .combo{flex-direction:row}\n'
css.write_text(text)
test=root/'tests/browser.py'
text=test.read_text().replace('    page.wait_for_timeout(690)', '''    # Observe readiness, not a fixed wall-clock delay under the test's virtual clock.
    page.wait_for_function("() => document.querySelector('#dialog').open || !document.querySelector('#submitButton').disabled",timeout=5000)''')
text=text.replace("    html=html.replace('<link rel=\"stylesheet\" href=\"./style.css\">','<style>'+(ROOT/'style.css').read_text()+'</style>')", "    html=html.replace('<link rel=\"stylesheet\" href=\"./style.css\">','<style>'+(ROOT/'style.css').read_text()+'\\n'+(ROOT/'action.css').read_text()+'</style>')")
text=text.replace("    html=html.replace('<script type=\"module\" src=\"./app.mjs\"></script>','')", "    html=re.sub(r'<script type=\"module\" src=\"\\./app\\.mjs[^\"]*\"></script>', '', html)")
start=text.index("    code='\\n'.join")
end=text.index('\ndef quit',start)
text=text[:start]+'''    chunks=[]
    for name in ['math.mjs','rig.mjs','action-ui.mjs','scene.mjs','audio.mjs','app.mjs']:
        code=(ROOT/name).read_text()
        if name=='action-ui.mjs':code=code[:code.rfind("if(typeof document!=='undefined'){")]
        code=re.sub(r'^import .*?;\\s*$', '',code,flags=re.M)
        code=re.sub(r'^export \\{.*?\\};\\s*$', '',code,flags=re.M)
        code=code.replace('export function ','function ').replace('export class ','class ').replace('export const ','const ')
        chunks.append(code)
    page.add_script_tag(type='module',content='\\n'.join(chunks)+'\\ninstallActionUI();');page.wait_for_timeout(450)
'''+text[end:]
test.write_text(text)
