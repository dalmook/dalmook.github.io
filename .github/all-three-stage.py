"""One-time exact-hash integration transport, removed before merging.
No commands from the payload are executed. Only these 19 game runtime/test
paths may change; all outputs are verified before anything is written.
"""
import hashlib,json,pathlib,zlib
allowed={
 'dopa-drill/index.html','dopa-drill/js/main.js',
 'dopa-ox/app.mjs','dopa-ox/index.html','dopa-ox/tests/engine.test.mjs',
 'dopa-word/app.mjs','dopa-word/audio-session.mjs','dopa-word/index.html',
 'dopa-word/render-budget.mjs','dopa-word/scene.mjs','dopa-word/tests/model.test.mjs','dopa-word/voice-pool.mjs',
 'dopa-runtime/audio-runtime.mjs','dopa-runtime/performance.css','dopa-runtime/protected-files.json',
 'dopa-runtime/render-budget.mjs','dopa-runtime/tests/runtime.test.mjs','dopa-runtime/tests/three_games.py','dopa-runtime/voice-pool.mjs'
}
compressed=b''.join(pathlib.Path(f'.github/all-three.part{i}').read_bytes() for i in range(1,7))
assert hashlib.sha256(compressed).hexdigest()=='33402b7aa31cfe6cce909ed427be4f777d4a585986f74fce0d48b754da7b8c54','Payload hash mismatch'
patches=json.loads(zlib.decompress(compressed))
assert len(patches)==len(allowed) and {x['path'] for x in patches}==allowed
outputs=[]
for item in patches:
 path=pathlib.Path(item['path']);assert not path.is_symlink()
 if item['before'] is None:
  assert not path.exists(),'New file already exists: '+str(path)
  text=item['text']
 else:
  before=path.read_bytes()
  assert hashlib.sha256(before).hexdigest()==item['before'],'Base changed: '+str(path)
  text=before.decode('utf8');length=len(text);boundary=length
  for start,end,replacement in reversed(item['ops']):
   assert isinstance(start,int) and isinstance(end,int) and 0<=start<=end<=boundary<=length
   text=text[:start]+replacement+text[end:];boundary=start
 after=text.encode('utf8')
 assert hashlib.sha256(after).hexdigest()==item['after'],'Result mismatch: '+str(path)
 if str(path)=='dopa-runtime/tests/three_games.py':
  start=text.index('def close_drill_prompts(page):');end=text.index('def ready(',start)
  text=text[:start]+'''def close_drill_prompts(page):
 # Original attendance/trophy modals appear 450-500ms after dismissing the
 # first-visit guide. Wait for the actual UI to stay clear, then open settings.
 deadline=time.monotonic()+8;quiet=None
 while time.monotonic()<deadline:
  clicked=False
  for selector in ['#guide-skip','#bonus-ok','#tg-ok','#hammer-no']:
   el=page.locator(selector)
   if el.count() and el.is_visible():el.click();clicked=True;quiet=None;break
  if not clicked:
   if quiet is None:quiet=time.monotonic()
   if time.monotonic()-quiet>.85:return
  page.wait_for_timeout(100)
 raise AssertionError('Original arithmetic welcome/reward dialogs did not settle')
'''+text[end:]
  text=text.replace('word defaults and public book preserved','word starter vocabulary preserved')
  after=text.encode('utf8')
  assert hashlib.sha256(after).hexdigest()=='24f9bb5230ff49008c26a29921c9dd3fdf6cef24a209f209264b29a2af69490d'
 outputs.append((path,after))
for path,data in outputs:
 path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
 print('Verified',path,hashlib.sha256(data).hexdigest())
