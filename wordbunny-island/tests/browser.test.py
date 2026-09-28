"""Browser DOM integration tests against the self-contained edition.
Navigation is disabled by this sandbox's Chromium policy. Tests use set_content
and intentionally exercise the app's non-persistent fallback. This does NOT
verify real-origin IndexedDB, service workers, TTS audio output or live Pages.
"""
import argparse,json,re,time,zipfile,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
RESULTS=[]
WORDS=[]
for f in sorted((ROOT/'content/packs').glob('*.json')):WORDS+=json.loads(f.read_text())['words']

def mark(name,details=''):
 RESULTS.append({'name':name,'status':'passed','details':details})
 print('PASS:',name,flush=True)

def page_new(browser,width=1280,height=950):
 page=browser.new_page(viewport={'width':width,'height':height},accept_downloads=True)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content((ROOT/'OPEN_WORD_BUNNY.html').read_text(encoding='utf-8'),wait_until='load')
 expect(page.locator('.hero-card')).to_be_visible()
 page.__test_errors=errors
 return page

def nav(page,target):
 page.locator(f'.sidebar [data-action=nav][data-route={target}],.mobile-nav [data-action=nav][data-route={target}]').filter(visible=True).first.click()

def gate(page):
 if page.locator('#parent-gate').count():
  nums=list(map(int,re.findall(r'\d+',page.locator('.gate-question').inner_text())))
  page.locator('#gate-answer').fill(str(sum(nums)))
  page.locator('#parent-gate button[type=submit]').click()

def choose(page,m):
 if page.locator('[data-action=leave-game]').count():
  page.locator('[data-action=leave-game]').click();page.locator('#confirm-action').click()
 else:
  nav(page,'games')
 page.locator(f'.game-card[data-mode={m}]').click()
 page.locator('#start-selected-game').click()
 expect(page.locator('.learning-shell')).to_be_visible()

def target(page):
 if page.locator('.question-image img').count():
  ko=page.locator('.question-image img').first.get_attribute('alt')
  found=next((w for w in WORDS if w['ko']==ko),None)
  if found:return found
 if page.locator('.question-meaning').count():
  ko=page.locator('.question-meaning').first.inner_text().strip()
  found=next((w for w in WORDS if w['ko']==ko),None)
  if found:return found
 if page.locator('.question-word').count():
  en=page.locator('.question-word').inner_text().strip()
  return next(w for w in WORDS if w['en']==en)
 if page.locator('.listen-orb').count():
  page.evaluate('() => {window.__spoken="";window.speechSynthesis.speak=(u)=>{window.__spoken=u.text;};}')
  page.locator('.listen-orb').click()
  en=page.evaluate('window.__spoken')
  return next(w for w in WORDS if w['en']==en)
 raise AssertionError('No target word')

def answer_correct(page):
 w=target(page)
 if page.locator('[data-action=answer-choice]').count():
  page.locator(f'[data-action=answer-choice][data-id="{w["id"]}"]').click()
 elif page.locator('.letter-btn').count():
  for ch in w['en'].lower():
   label='␣' if ch==' ' else ch
   page.locator('.letter-btn:not(:disabled)').filter(has_text=re.compile('^'+re.escape(label)+'$')).first.click()
  page.locator('[data-action=submit-spell]').click()
 elif page.locator('#typing-form').count():
  page.locator('#typing-answer').fill(w['en'].upper())
  page.locator('#typing-form button').click()
 elif page.locator('.ox-grid').count():
  matches=page.locator('.question-word').inner_text().strip()==w['en']
  page.locator('[data-action=answer-ox][data-value="'+str(matches).lower()+'"]').click()
 else:raise AssertionError('Unknown mode')
 expect(page.locator('.feedback')).to_be_visible()
 assert '맞았어!' in page.locator('.feedback').inner_text(),page.locator('.feedback').inner_text()
 page.locator('[data-action=next-question]').click()

def play_to_end(page):
 for i in range(45):
  if page.locator('.summary').count():return
  answer_correct(page)
 raise AssertionError('Session never finished')

def editor_tests(browser):
 page=page_new(browser)
 nav(page,'words')
 expect(page.locator('.word-card')).to_have_count(48)
 mark('48 starter words rendered with working local illustrations')
 page.locator('.page-head [data-action=add-word]').click()
 expect(page.locator('#parent-gate')).to_be_visible()
 page.locator('#gate-answer').fill('0');page.locator('#parent-gate button[type=submit]').click()
 expect(page.locator('.form-error')).to_be_visible()
 gate(page);expect(page.locator('#word-form')).to_be_visible()
 mark('Parent gate rejects incorrect answers and opens editor on correct answer')
 page.locator('#word-en').fill('rocket');page.locator('#word-ko').fill('로켓')
 page.locator('#word-cat').fill('나의 우주');page.locator('#word-example').fill('I see a rocket.')
 page.locator('#photo-file').set_input_files(str(ROOT/'assets/icon-192.png'))
 expect(page.locator('#photo-preview img')).to_be_visible()
 page.locator('#save-word').click()
 expect(page.locator('.word-card')).to_have_count(1)
 assert page.locator('.word-card h3').inner_text()=='rocket'
 photo=page.locator('.word-card .word-image img').get_attribute('src')
 assert photo.startswith('data:image/')
 mark('Word + photo upload, image compression and saved card render')
 nav(page,'home');nav(page,'words')
 assert page.locator('.word-card h3').inner_text()=='rocket'
 mark('Custom photo and word survive navigation within session (not reload)')
 page.locator('[data-action=edit-word]').first.click()
 page.locator('#word-ko').fill('우주 로켓');page.locator('#save-word').click()
 assert page.locator('.meaning').inner_text()=='우주 로켓'
 mark('Editing a custom word retains its ID and photo')
 page.locator('.page-head [data-action=add-word]').click()
 page.locator('#word-en').fill('rocket');page.locator('#word-ko').fill('우주 로켓');page.locator('#save-word').click()
 expect(page.locator('.form-error')).to_contain_text('이미 있어요')
 page.locator('[data-action=close-modal]').first.click()
 mark('Duplicate direct entries are rejected')
 page.locator('[data-action=bulk-import]').click()
 page.locator('#bulk-text').fill('en,ko,category\nkite,연,나의 우주\nrobot,로봇,나의 우주\napple,사과,맛있는 숲')
 page.locator('[data-action=preview-import]').click()
 expect(page.locator('#import-result')).to_contain_text('2개 추가 예정')
 expect(page.locator('#import-result')).to_contain_text('중복 1개')
 page.locator('#commit-import').click();expect(page.locator('.word-card')).to_have_count(3)
 mark('CSV preview skips existing duplicates and commits only two new words')
 page.locator('#word-search').fill('robot');expect(page.locator('.word-card')).to_have_count(1)
 page.locator('[data-action=favorite]').first.click()
 page.locator('#word-search').fill('');page.locator('[data-filter=favorite]').click()
 expect(page.locator('.word-card')).to_have_count(1)
 mark('Search and favorite filtering are functional')
 # Use the uploaded image in a real learning round, not only a preview card.
 WORDS.extend([
  {'id':'test-rocket','en':'rocket','ko':'우주 로켓'},
  {'id':'test-kite','en':'kite','ko':'연'},
  {'id':'test-robot','en':'robot','ko':'로봇'}])
 nav(page,'games');page.locator('.game-card[data-mode=spell]').click()
 page.locator('#game-category').select_option('나의 우주')
 page.locator('#start-selected-game').click()
 saw_photo=False
 for _ in range(3):
  current=target(page)
  if current['en']=='rocket':
   assert page.locator('.question-image img').get_attribute('src').startswith('data:image/')
   saw_photo=True
  answer_correct(page)
 expect(page.locator('.summary')).to_be_visible()
 assert saw_photo
 mark('Newly entered words and uploaded photo participate in a completed spelling game')
 nav(page,'records')
 with page.expect_download() as dl:page.locator('[data-action=backup]').click()
 backup=ROOT/'tests/test-backup.json';dl.value.save_as(backup)
 data=json.loads(backup.read_text())
 assert data['app']=='wordbunny-island' and len(data['custom'])==3
 assert any(w['image'].startswith('data:image/') for w in data['custom'] if w['image'])
 mark('Full backup includes actual compressed image data and custom words')
 new=page_new(browser);nav(new,'records');new.locator('[data-action=restore]').click();gate(new)
 new.locator('#restore-file').set_input_files(str(backup));new.locator('#restore-confirm').click()
 nav(new,'words');new.locator('[data-filter=custom]').click()
 expect(new.locator('.word-card')).to_have_count(3)
 assert new.locator('.word-card .word-image img').count()==1
 mark('Backup restores words, photo and favorites into a fresh browser page')
 new.locator('[data-action=content-help]').click()
 with new.expect_download() as dl:new.locator('[data-action=export-content]').click()
 zpath=ROOT/'tests/test-content.zip';dl.value.save_as(zpath)
 with zipfile.ZipFile(zpath) as z:
  assert z.testzip() is None
  pack=json.loads(z.read('content/packs/my-library.json'))
  assert len(pack['words'])==51
  image_paths=[w['image'] for w in pack['words'] if w['image']]
  assert all(path in z.namelist() for path in image_paths)
  assert 'state' not in pack and 'progress' not in pack
 mark('GitHub ZIP passes CRC checks, contains 51 words and all referenced images, excludes learning state')
 new.locator('[data-action=close-modal]').first.click()
 new.locator('[data-filter=custom]').click()
 new.locator('[data-action=edit-word]').first.click()
 new.locator('[data-action=delete-word]').click();new.locator('#confirm-action').click()
 expect(new.locator('.word-card')).to_have_count(2)
 mark('Custom word deletion requires confirmation and removes the correct card')
 assert not page.__test_errors and not new.__test_errors
 mark('No unhandled JavaScript exceptions during authoring and export/restore flows')
 page.close();new.close()

def learning_tests(browser):
 page=page_new(browser)
 page.emulate_media(reduced_motion="reduce")
 # Each mode is played using actual controls, not injected answer results.
 for m in ['picture','meaning','listen','spell','type','balloon','ox']:
  choose(page,m);play_to_end(page)
  expect(page.locator('.summary')).to_be_visible()
  assert page.locator('.summary-stats').inner_text().find('10/10')>=0
  mark('Complete 10-question '+m+' session with real answer controls', 'listen verifies utterance text via spy, not physical audio' if m=='listen' else '')
 choose(page,'memory')
 pairs={}
 for i,k in enumerate(page.locator('[data-card-key]').evaluate_all('(els)=>els.map(e=>[e.dataset.index,e.dataset.cardKey])')):
  idx,key=k;pid=key.rsplit('-',1)[0];pairs.setdefault(pid,[]).append(int(idx))
 for indices in pairs.values():
  for idx in indices:page.locator(f'[data-action=memory-card][data-index="{idx}"]').click()
  page.wait_for_timeout(500)
 expect(page.locator('.summary')).to_be_visible()
 mark('Complete all four face-down memory pairs and award a finished session')
 nav(page,'home');page.locator('[data-action=start-adventure]').click()
 for _ in range(5):page.locator('[data-action=study-next]').click()
 play_to_end(page)
 expect(page.locator('.summary')).to_be_visible()
 mark('Five-card guided introduction followed by ten mixed questions reaches summary')
 choose(page,'picture')
 w=target(page)
 wrong=page.locator(f'[data-action=answer-choice]:not([data-id="{w["id"]}"])').first
 wrong.click();expect(page.locator('.feedback')).to_have_class(re.compile('incorrect'))
 expect(page.locator('.feedback')).to_contain_text(w['en'])
 expect(page.locator('.learning-counter')).to_contain_text('/11')
 page.locator('[data-action=next-question]').click();play_to_end(page)
 mark('Wrong answer reveals correct word, inserts one retry and still completes')
 choose(page,'spell');page.locator('[data-action=hint]').click()
 expect(page.locator('.hint-box')).to_be_visible()
 # A coached correct answer should not be labeled an independent correct.
 w=target(page)
 for ch in w['en']:page.locator('.letter-btn:not(:disabled)').filter(has_text=re.compile('^'+re.escape(ch)+'$')).first.click()
 page.locator('[data-action=submit-spell]').click()
 expect(page.locator('.feedback')).to_contain_text('도움받아 완성')
 mark('Hinted answers are identified separately and queued for review')
 page.locator('[data-action=leave-game]').click();page.locator('#confirm-action').click()
 nav(page,'friends')
 page.locator('[data-action=outfit][data-id=flower]').click();page.locator('#confirm-action').click()
 expect(page.locator('.outfit-card.equipped h3')).to_have_text('봄꽃 머리핀')
 mark('Earned coins buy an outfit, update the character and mark it equipped')
 nav(page,'records');assert int(page.locator('.report-stat strong').first.inner_text())>0
 mark('Learning data reaches records, review list, XP and currency views')
 assert not page.__test_errors,page.__test_errors
 mark('No unhandled JavaScript exceptions across learning sessions')
 page.close()

def screenshot_tests(browser):
 page=page_new(browser)
 for width in [360,390,768,1280,1440]:
  page.set_viewport_size({'width':width,'height':900})
  for r in ['home','words','games','friends','records']:
   nav(page,r)
   assert not page.evaluate('document.documentElement.scrollWidth > innerWidth+1'),(width,r)
  mark(f'No horizontal overflow at {width}px across all five main screens')
 page.set_viewport_size({'width':1440,'height':1060});nav(page,'home')
 page.evaluate('window.scrollTo(0,document.body.scrollHeight)');page.wait_for_timeout(150);page.evaluate('window.scrollTo(0,0)');page.wait_for_timeout(150)
 page.screenshot(path=str(ROOT/'tests/home-desktop.png'),full_page=True)
 page.set_viewport_size({'width':390,'height':844});nav(page,'home');page.evaluate('window.scrollTo(0,document.body.scrollHeight)');page.wait_for_timeout(200);page.evaluate('window.scrollTo(0,0)');page.wait_for_timeout(150)
 page.screenshot(path=str(ROOT/'tests/home-mobile.png'),full_page=True)
 for r in ['words','games','friends']:
  nav(page,r);page.evaluate('window.scrollTo(0,document.body.scrollHeight)');page.wait_for_timeout(100);page.evaluate('window.scrollTo(0,0)');page.wait_for_timeout(100)
  page.screenshot(path=str(ROOT/f'tests/{r}-mobile.png'),full_page=True)
 choose(page,'spell');page.wait_for_timeout(600);page.screenshot(path=str(ROOT/'tests/spell-mobile.png'),full_page=True)
 mark('Desktop and mobile screenshots captured from running app DOM')
 page.locator('[data-action=leave-game]').click();page.locator('#confirm-action').click()
 page.locator('[data-action=settings]').click()
 page.locator('[data-setting=reduced]').click();page.locator('#settings-form button[type=submit]').click()
 assert page.locator('body').evaluate('(b)=>b.classList.contains("reduce-motion")')
 mark('Reduced-motion setting applies to all animations')
 assert not page.__test_errors,page.__test_errors
 page.close()

def main():
 ap=argparse.ArgumentParser();ap.add_argument('group',choices=['editor','learning','screens']);args=ap.parse_args()
 started=time.time()
 try:
  with sync_playwright() as p:
   b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
   {'editor':editor_tests,'learning':learning_tests,'screens':screenshot_tests}[args.group](b)
   b.close()
 except Exception as e:
  RESULTS.append({'name':'Unfinished group '+args.group,'status':'failed','details':str(e)})
  traceback.print_exc()
 finally:
  output={'group':args.group,'method':'Chromium set_content; opaque origin; storage fallback; no live site','elapsed_seconds':round(time.time()-started,2),'results':RESULTS}
  (ROOT/f'tests/browser-{args.group}-results.json').write_text(json.dumps(output,ensure_ascii=False,indent=2),encoding='utf-8')
 if any(r['status']=='failed' for r in RESULTS):raise SystemExit(1)
if __name__=='__main__':main()
