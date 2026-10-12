"""Real Chromium / in-memory regression suite. No YouTube credentials or live search."""
import json, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
mode=sys.argv[1] if len(sys.argv)>1 else 'baseline'
probe='''(()=>{const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);const pending=new Set();window.__raf={callbacks:0,pending};window.requestAnimationFrame=f=>{let id;id=request(t=>{pending.delete(id);window.__raf.callbacks++;f(t)});pending.add(id);return id};window.cancelAnimationFrame=id=>{pending.delete(id);return cancel(id)}})();'''
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
 ctx=b.new_context(viewport={'width':1280,'height':960},reduced_motion='no-preference',accept_downloads=True)
 ctx.add_init_script(probe)
 page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.evaluate(probe);page.set_content((ROOT/'index.html').read_text(),wait_until='load');page.wait_for_function('window.SURCO && document.querySelector("#scene-boot").hidden')
 page.wait_for_timeout(3500)
 report={'mode':mode,'browser':b.version,'viewport':'1280x960','gpu':'SwiftShader software, headed Chromium under Xvfb','origin':'opaque set_content; HTTP blocked by browser administrator','errors':errors,'tests':[]}
 def snap():return page.evaluate('SURCO.snapshot()')
 def wait(expr):
  until=time.monotonic()+12
  while time.monotonic()<until:
   if page.evaluate('() => ('+expr+')'):return
   page.wait_for_timeout(60)
  raise AssertionError('Timeout: '+expr) 
 def test(name,fn):
  try: fn(); report['tests'].append({'name':name,'status':'pass'}); print('PASS',name,flush=True)
  except Exception as e: report['tests'].append({'name':name,'status':'fail','error':str(e)});print('FAIL',name,str(e),flush=True)
 def check(x,msg='assertion failed'):
  if not x: raise AssertionError(msg)
 n=page.evaluate('__raf.callbacks');t=time.monotonic();page.wait_for_timeout(1200);report['idle']={'callbacks':page.evaluate('__raf.callbacks')-n,'pending':page.evaluate('__raf.pending.size'),'windowSeconds':round(time.monotonic()-t,3)}
 test('no persistent RAF callbacks at idle',lambda:check(report['idle']['callbacks']==0,str(report['idle'])))
 page.locator('#primary-action').click();page.locator('#primary-action').evaluate('e=>e.click()')
 test('second valid intent mounts immediately without animation lock',lambda:check(snap()['stage']=='mounted',str(snap())))
 page.wait_for_timeout(1500)
 page.evaluate('document.querySelector("#eject").click()')
 page.locator('#primary-action').click()
 page.emulate_media(reduced_motion='reduce')
 wait('SURCO.snapshot().reduced')
 test('switch to reduced motion settles an in-flight transition',lambda:check(snap().get('motion',{}).get('recordActive') is False,str(snap())))
 page.emulate_media(reduced_motion='no-preference');wait('!SURCO.snapshot().reduced')
 test('system motion preference changes in both directions',lambda:check(not snap()['reduced'],str(snap())))
 page.evaluate('document.querySelector("#eject").click()')
 page.locator('.record-card').nth(1).focus()
 page.locator('.record-card').nth(1).evaluate('e=>{window._card=e;e.click()}')
 test('selection preserves card DOM identity and keyboard focus',lambda:check(page.evaluate('document.activeElement===window._card && window._card.isConnected')))

 if mode!='baseline':
  page.evaluate('window.scrollTo(0,0)')
  def stress():
   for i in range(20):
    page.evaluate("() => {document.querySelector('#eject').click();document.querySelector('#primary-action').click();document.querySelector('#primary-action').click();document.querySelector('#next').click();document.querySelector('#help-open').click();document.querySelector('#help-dialog').close();}")
   wait('!SURCO.snapshot().motion.recordActive && SURCO.snapshot().motion.domActive===0')
   check(snap()['stage']=='sleeved' and not snap()['playing'])
   check(page.locator('.record-card').count()==3)
   check(page.locator('.motion-sleeve').count()==0)
   check(page.evaluate('document.querySelectorAll("dialog[open]").length===0'))
  test('20 overlapping stage/selection/dialog cycles clean up',stress)
  def same_selection():
   page.evaluate("() => {document.querySelector('#primary-action').click();document.querySelector('#primary-action').click();}")
   wait('SURCO.snapshot().ready')
   selected=page.locator('.record-card[aria-pressed=true]')
   selected.evaluate('el=>el.click()')
   check(snap()['stage']=='mounted' and snap()['ready'])
  test('selecting the same record does not reset prepared media',same_selection)
  def camera_interrupt():
   for i in range(5):page.locator('#camera-view').evaluate('e=>e.click()')
   page.emulate_media(reduced_motion='reduce');wait('SURCO.snapshot().reduced')
   check(not snap()['motion']['cameraActive'])
   check(page.locator('#camera-view').get_attribute('aria-pressed')=='true')
   page.emulate_media(reduced_motion='no-preference');wait('!SURCO.snapshot().reduced')
   page.locator('#camera-view').evaluate('e=>e.click()');wait('!SURCO.snapshot().motion.cameraActive')
  test('camera reversal and reduction reach the last requested view',camera_interrupt)
  def system_priority():
   page.emulate_media(reduced_motion='reduce');wait('SURCO.snapshot().reduced')
   page.locator('#reduce-motion').evaluate("el=>{el.checked=false;el.dispatchEvent(new Event('change'))}")
   check(snap()['reduced'] and page.locator('#reduce-motion').is_checked())
   page.emulate_media(reduced_motion='no-preference');wait('!SURCO.snapshot().reduced')
  test('manual setting cannot override system reduced motion',system_priority)
  def modal_focus():
   page.locator('#help-open').click();page.keyboard.press('Escape')
   wait('!document.querySelector("#help-dialog").open')
   check(page.evaluate('document.activeElement.id')=='help-open')
  test('Escape closes modal and restores focus to its opener',modal_focus)
  def reduced_audio():
   ctx.set_offline(True)
   page.emulate_media(reduced_motion='reduce');wait('SURCO.snapshot().reduced')
   page.locator('#primary-action').evaluate('e=>e.click()')
   wait('SURCO.snapshot().playing && document.querySelector("#audio").currentTime>.1')
   check(not snap()['motion']['recordActive'] and not snap()['motion']['scopePending'])
   page.locator('#primary-action').evaluate('e=>e.click()')
   wait('!SURCO.snapshot().playing && !SURCO.snapshot().motion.rendererPending')
   page.emulate_media(reduced_motion='no-preference');wait('!SURCO.snapshot().reduced')
  test('offline playback works with all motion reduced',reduced_audio)
  def gesture_cancel():
   page.evaluate("() => {document.querySelector('#eject').click();document.querySelector('#primary-action').click();}")
   wait('!SURCO.snapshot().motion.recordActive')
   rect=page.locator('#scene').bounding_box();point=page.evaluate('SURCO.project([-3.35,2.90,1.05])');x=rect['x']+point[0];y=rect['y']+point[1]
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+40,y+20)
   page.emulate_media(reduced_motion='reduce');wait('SURCO.snapshot().reduced');page.mouse.up()
   check(not snap()['motion']['recordActive'])
   check(snap()['stage']=='extracted')
   if 'recordPosition' in snap()['motion']:check(all(abs(a-b)<.01 for a,b in zip(snap()['motion']['recordPosition'],[-3.35,2.90,1.05])),str(snap()))
   page.emulate_media(reduced_motion='no-preference');wait('!SURCO.snapshot().reduced')
  test('reduction during a live pointer drag returns to stable hand position',gesture_cancel)
  def resize():
   page.locator('#primary-action').evaluate('e=>e.click()')
   page.set_viewport_size({'width':390,'height':844})
   wait('!SURCO.snapshot().motion.recordActive')
   check(page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   check(snap()['stage']=='mounted')
   page.screenshot(path=str(ROOT/'evidence'/'motion-mobile.png'),full_page=True)
   page.set_viewport_size({'width':1280,'height':960})
  test('resize mid-transfer preserves stage and mobile layout',resize)
  page.evaluate("() => {document.querySelector('#eject').click();window.scrollTo(0,0);}")
  wait('!SURCO.snapshot().motion.recordActive && !SURCO.snapshot().motion.rendererPending')
  before=page.evaluate('__raf.callbacks');page.wait_for_timeout(1200)
  test('no lingering RAF after stress, playback and resize',lambda:check(page.evaluate('__raf.callbacks')==before))
  test('no uncaught application errors across the suite',lambda:check(not errors,str(errors)))
 page.screenshot(path=str(ROOT/'evidence'/f'{mode}-desktop.png'),full_page=True)
 report['snapshot']=snap();(ROOT/'evidence'/f'{mode}.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
 b.close()
 print(json.dumps(report['idle']))
 if mode!='baseline' and any(t['status']=='fail' for t in report['tests']):sys.exit(1)
