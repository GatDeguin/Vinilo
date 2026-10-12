import json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
results=[];errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1280,'height':1400},reduced_motion='no-preference');page.set_default_timeout(12000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content((ROOT/'index.html').read_text())
 def wait(expr):
  until=time.monotonic()+20
  while time.monotonic()<until:
   if page.evaluate('() => ('+expr+')'):return
   page.wait_for_timeout(80)
  raise AssertionError(expr)
 wait('window.SURCO && SURCO.snapshot().drawCalls>0 && !SURCO.snapshot().motion.rendererPending')
 page.evaluate('window.scrollTo(0,270)');page.wait_for_timeout(300)
 page.evaluate("() => {const original=SurcoMotion.Director.prototype.transfer;SurcoMotion.Director.prototype.transfer=function(img,dest,...rest){window._transfer={source:img?.getBoundingClientRect().toJSON(),dest,scrollY,innerHeight};return original.call(this,img,dest,...rest)}}")
 # Pause only the DOM transfer so its actual midpoint can be visually inspected.
 info=page.evaluate("""() => {const card=document.querySelectorAll('.record-card')[1];card.click();const ghost=document.querySelector('.motion-sleeve');if(!ghost)return null;const a=ghost.getAnimations()[0];a.pause();a.currentTime=190;return {aria:ghost.getAttribute('aria-hidden'),inert:ghost.inert,pointer:getComputedStyle(ghost).pointerEvents};}""")
 assert info=={'aria':'true','inert':True,'pointer':'none'},str(info)+' '+str(page.evaluate('window._transfer'))
 page.screenshot(path=str(ROOT/'evidence'/'shared-midpoint.png'),full_page=False)
 results.append('shared sleeve midpoint: real DOM animation, inert and aria-hidden')
 page.locator('#primary-action').evaluate('e=>e.click()');wait('!SURCO.snapshot().motion.recordActive')
 assert page.locator('.motion-sleeve').count()==0
 results.append('extract cancels paused sleeve-transfer clone and restores real sleeve')
 page.screenshot(path=str(ROOT/'evidence'/'extracted.png'),full_page=True)
 page.locator('#primary-action').evaluate('e=>e.click()');wait('SURCO.snapshot().ready && !SURCO.snapshot().motion.recordActive')
 page.locator('#primary-action').evaluate('e=>e.click()');wait('SURCO.snapshot().playing')
 page.evaluate('window.scrollTo(0,0)');page.wait_for_timeout(800)
 page.screenshot(path=str(ROOT/'evidence'/'playing.png'),full_page=True)
 results.append('actual local audio and real WebGL playing screenshot')
 # Compare attached canvas listener count across a deliberate context restoration.
 cdp=page.context.new_cdp_session(page)
 def listener_count():
  obj=cdp.send('Runtime.evaluate',{'expression':'document.querySelector("#scene")'})['result']['objectId']
  return len(cdp.send('DOMDebugger.getEventListeners',{'objectId':obj})['listeners'])
 before=listener_count()
 page.evaluate("() => {window.__ext=document.querySelector('#scene').getContext('webgl2').getExtension('WEBGL_lose_context');window.__ext.loseContext();}")
 wait('!document.querySelector("#fallback").hidden');assert page.evaluate('!document.querySelector("#audio").paused')
 results.append('GPU context loss leaves real local audio playing')
 page.evaluate('window.__ext.restoreContext()');wait('document.querySelector("#fallback").hidden && SURCO.snapshot().drawCalls>0')
 assert listener_count()==before
 results.append(f'GPU restoration: canvas listener count remains {before}, no duplicated handlers')
 page.locator('#primary-action').evaluate('e=>e.click()');wait('!SURCO.snapshot().motion.rendererPending')
 assert not errors,errors
 results.append('no uncaught errors or pending renderer after pause')
 (ROOT/'evidence'/'visual-motion.json').write_text(json.dumps({'browser':b.version,'results':results,'errors':errors},indent=2))
 print(json.dumps(results));b.close()
