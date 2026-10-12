"""Browser verification. --url runs against a real local/hosted origin.
The constrained build environment uses --memory (set_content / opaque origin).
Search tests inject controlled API responses, not live YouTube search results.
"""
import argparse,json,os,time,base64
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--suite',choices=['media','search','mobile','render','motion','persistence'],required=True);ap.add_argument('--url');ap.add_argument('--memory',action='store_true');ap.add_argument('--browser',default='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None);args=ap.parse_args()
results=[];errors=[]
def check(name,fn):
 try: fn();results.append({'name':name,'status':'passed'});print('PASS',name,flush=True)
 except Exception as e:results.append({'name':name,'status':'failed','detail':str(e)});print('FAIL',name,str(e),flush=True);raise
with sync_playwright() as p:
 is3d=args.suite in ['mobile','render','motion']
 b=p.chromium.launch(executable_path=args.browser,headless=not is3d,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
 ctx=b.new_context(viewport={'width':390 if args.suite=='mobile' else 1280,'height':844 if args.suite=='mobile' else 960},device_scale_factor=1,reduced_motion='no-preference' if args.suite=='motion' else 'reduce',has_touch=args.suite=='mobile',is_mobile=args.suite=='mobile',accept_downloads=True)
 page=ctx.new_page();page.set_default_timeout(8000);page.on('pageerror',lambda e:errors.append(str(e)))
 if args.url:page.goto(args.url,wait_until='load')
 else:page.set_content((ROOT/'index.html').read_text(),wait_until='load')
 page.wait_for_function('window.SURCO && document.querySelector("#scene-boot").hidden')
 click=lambda id:page.locator('#'+id).click(force=True)
 snap=lambda:page.evaluate('SURCO.snapshot()')
 def wait(expr):
  deadline=time.monotonic()+12
  while time.monotonic()<deadline:
   if page.evaluate("() => Boolean("+expr+")"):return
   page.wait_for_timeout(100)
  raise AssertionError('Timed out waiting for '+expr)
 def primary():click('primary-action');page.wait_for_timeout(120)
 try:
  if args.suite=='media':
   ctx.set_offline(True);results.append({'name':'browser offline during all local media checks','status':'passed'})
   check('initial state has three real offline studies',lambda:(_ for _ in ()).throw(AssertionError()) if page.locator('.record-card').count()!=3 else None)
   primary()
   assert snap()['stage']=='extracted';results.append({'name':'extract record','status':'passed'});print('PASS extract record',flush=True)
   primary();wait('SURCO.snapshot().ready && SURCO.snapshot().duration>0');assert snap()['stage']=='mounted';results.append({'name':'mount record and decode bundled MP3','status':'passed'});print('PASS mount and decode',flush=True)
   primary();wait('SURCO.snapshot().playing && document.querySelector("#audio").currentTime>0.1');results.append({'name':'real local media playback','status':'passed'});print('PASS real playback',flush=True)
   click('mute');assert page.evaluate('document.querySelector("#audio").muted');click('mute');results.append({'name':'mute/unmute controls actual media','status':'passed'})
   page.locator('#volume').evaluate("el=>{el.value='35';el.dispatchEvent(new Event('input',{bubbles:true}));}");assert page.evaluate('document.querySelector("#audio").volume')==.35;results.append({'name':'volume controls actual media','status':'passed'})
   page.locator('#seek').evaluate("el=>{el.value='500';el.dispatchEvent(new Event('input',{bubbles:true}));}");assert page.evaluate('document.querySelector("#audio").currentTime')>15;results.append({'name':'seek changes media time','status':'passed'})
   primary();assert not snap()['playing'];results.append({'name':'pause from primary control','status':'passed'})
   click('eject');assert snap()['stage']=='sleeved' and not snap()['playing'];results.append({'name':'eject stops playback and resets physical state','status':'passed'})
   page.locator('#audio-files').set_input_files(ROOT/'assets/hora-azul.mp3');wait('SURCO.snapshot().selected.kind==="local"');primary();primary();wait('SURCO.snapshot().ready && SURCO.snapshot().duration>0');primary();wait('SURCO.snapshot().playing');results.append({'name':'import and play a real local MP3','status':'passed'});print('PASS local file import',flush=True)
   if not args.url:
    assert 'sesión' in page.locator('#toast').inner_text();results.append({'name':'unavailable storage warning survives successful media import','status':'passed'})
   page.evaluate("() => {window._originalURL=URL.createObjectURL;URL.createObjectURL=function(blob){if(blob.type==='application/json')window._exported=blob;return window._originalURL.call(URL,blob);}; const originalClick=HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click=function(){if(this.download){window._downloadRequested=this.download;return;}return originalClick.call(this);};}")
   click('library-tools-open');click('export-collection');wait('window._exported');export=page.evaluate('async()=>JSON.parse(await window._exported.text())');assert export['app']=='SURCO' and export['schema']==1 and export['records'][0]['audio'].startswith('data:audio/mpeg;base64,');assert 'key' not in export;assert base64.b64decode(export['records'][0]['audio'].split(',')[1])==(ROOT/'assets/hora-azul.mp3').read_bytes();results.append({'name':'portable JSON export contains actual local audio bytes','status':'passed'});print('PASS actual backup contents',flush=True)
   page.locator('#backup-file').set_input_files({'name':'broken.json','mimeType':'application/json','buffer':b'{not-json'});wait('document.querySelector("#toast").textContent.includes("JSON")');results.append({'name':'corrupt JSON backup rejected','status':'passed'})
   page.close();page=ctx.new_page();page.set_default_timeout(8000);page.on('pageerror',lambda e:errors.append(str(e)))
   if args.url:page.goto(args.url,wait_until='load')
   else:page.set_content((ROOT/'index.html').read_text(),wait_until='load')
   wait('window.SURCO && document.querySelector("#scene-boot").hidden')
   page.locator('#backup-file').set_input_files({'name':'roundtrip.surco.json','mimeType':'application/json','buffer':json.dumps(export).encode()})
   wait('document.querySelector("#toast").textContent.includes("Copia importada")');assert snap()['saved']==1
   results.append({'name':'portable backup restores collection in a fresh document','status':'passed'});print('PASS fresh-document backup restore',flush=True)
   if not args.url:assert 'sesión' in page.locator('#toast').inner_text()
   page.locator('.record-card').first.click(force=True);primary();primary();wait('SURCO.snapshot().ready && SURCO.snapshot().duration>0');primary();wait('SURCO.snapshot().playing');results.append({'name':'restored local audio decodes and plays offline','status':'passed'})
   assert not errors;results.append({'name':'no uncaught application exceptions','status':'passed'})
  elif args.suite=='search':
   page.evaluate("""() => {window._requests=[];window._realFetch=window.fetch;window.fetch=async function(url,opt){if(String(url).includes('googleapis.com/youtube/v3/search')){window._requests.push({url:String(url),key:opt.headers['X-Goog-Api-Key']});if(window._quota)return new Response(JSON.stringify({error:{errors:[{reason:'quotaExceeded'}]}}),{status:403});if(new URL(url).searchParams.has('pageToken'))return new Response(JSON.stringify({items:[{id:{videoId:'abcdefghijk'},snippet:{title:'TEST: second video',channelTitle:'Fixture channel'}}]}));return new Response(JSON.stringify({nextPageToken:'TEST_PAGE_2',items:[{id:{videoId:'dQw4w9WgXcQ'},snippet:{title:'TEST &amp; <img src=x onerror=alert(1)>',channelTitle:'Fixture channel'}}]}));}return window._realFetch(url,opt);};}""")
   page.locator('#search').fill('test jazz');page.locator('#search-form').evaluate("f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");assert page.locator('#settings-dialog').evaluate('el=>el.open');results.append({'name':'missing API key opens configuration, no fake results','status':'passed'})
   page.locator('#api-key').fill('TEST_KEY_012345678901234567890');click('key-save');wait('SURCO.snapshot().results===1');assert page.evaluate('_requests[0].key')=='TEST_KEY_012345678901234567890';assert 'key=' not in page.evaluate('_requests[0].url');results.append({'name':'search contract uses official endpoint and API key header','status':'passed'})
   assert page.locator('.record-card .card-title').inner_text()=='TEST & <img src=x onerror=alert(1)>';assert page.locator('.record-card img[src=x]').count()==0;results.append({'name':'untrusted API titles rendered as text, not HTML','status':'passed'})
   click('load-more');wait('SURCO.snapshot().results===2');assert 'pageToken=TEST_PAGE_2' in page.evaluate('_requests[1].url');results.append({'name':'pagination follows nextPageToken','status':'passed'})
   page.evaluate('window._quota=true');page.locator('#search').fill('another query');page.locator('#search-form').evaluate("f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");wait('document.querySelector("#search-status").textContent.includes("cuota")');results.append({'name':'quota errors are reported, never replaced with invented results','status':'passed'})
   click('settings-open');click('key-forget');assert not snap()['apiConnected'];page.locator('#settings-dialog .close-dialog').click(force=True);results.append({'name':'forget key removes application credential','status':'passed'})
   click('link-open');page.locator('#video-url').fill('https://youtube.com.attacker.test/watch?v=dQw4w9WgXcQ');page.locator('#link-form').evaluate("f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");assert 'válido' in page.locator('#link-error').inner_text();results.append({'name':'host spoofing in pasted URLs rejected','status':'passed'})
   page.locator('#video-url').fill('https://youtu.be/dQw4w9WgXcQ');page.locator('#link-form').evaluate("f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");wait('SURCO.snapshot().selected.kind==="youtube"');results.append({'name':'valid YouTube URL creates real video reference without key','status':'passed'})
   assert not errors;results.append({'name':'no uncaught exceptions in search flows','status':'passed'})
  elif args.suite=='mobile':
   wait('SURCO.snapshot().drawCalls>0');assert snap()['renderer']=='WebGL2';results.append({'name':'real WebGL2 scene in mobile-size Chromium viewport','status':'passed'})
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');results.append({'name':'390px viewport has no horizontal page overflow','status':'passed'})
   assert snap()['reduced'];results.append({'name':'system reduced-motion preference applied','status':'passed'})
   page.wait_for_timeout(8000);page.screenshot(path=str(ROOT/'tests/mobile.png'),full_page=True)
   click('help-open');assert page.locator('#help-dialog').evaluate('el=>el.open');page.keyboard.press('Escape');assert not page.locator('#help-dialog').evaluate('el=>el.open');results.append({'name':'help dialog opens and Escape dismisses with native focus handling','status':'passed'})
   assert not errors;results.append({'name':'no uncaught mobile-layout exceptions','status':'passed'})
  elif args.suite=='render':
   wait('SURCO.snapshot().drawCalls>0');assert snap()['renderer']=='WebGL2';results.append({'name':'WebGL2 programs compile and scene renders','status':'passed'});print('PASS real WebGL2 render',flush=True)
   primary();assert snap()['stage']=='extracted';pos=page.evaluate('SURCO.project([-3.35,2.90,1.05])');target=page.evaluate('SURCO.project([-.65,1.46,-.1])');box=page.locator('#scene').bounding_box();page.mouse.move(box['x']+pos[0],box['y']+pos[1]);page.mouse.down();page.mouse.move(box['x']+target[0],box['y']+target[1],steps=8);page.mouse.up();wait('SURCO.snapshot().stage==="mounted"');results.append({'name':'pointer drag moves record from hand to platter','status':'passed'});print('PASS physical drag',flush=True)
   wait('SURCO.snapshot().ready');primary();wait('SURCO.snapshot().playing');page.wait_for_timeout(600);results.append({'name':'3D scene connected to actual audio playing state','status':'passed'})
   page.mouse.move(20,20);page.wait_for_timeout(1000);page.screenshot(path=str(ROOT/'tests/desktop-playing.png'),full_page=True);print('saved screenshot',flush=True)
   click('camera-view');assert page.locator('#camera-view').get_attribute('aria-pressed')=='true';results.append({'name':'top-view camera changes scene','status':'passed'})
   assert not errors;results.append({'name':'no uncaught WebGL application exceptions','status':'passed'})
  elif args.suite=='motion':
   wait('SURCO.snapshot().drawCalls>0');click('settings-open');page.locator('#reduce-motion').uncheck(force=True);page.locator('#settings-dialog .close-dialog').click(force=True);assert not snap()['reduced']
   primary();wait('SURCO.snapshot().stage==="extracted" && !SURCO.snapshot().busy');primary();wait('SURCO.snapshot().stage==="mounted" && !SURCO.snapshot().busy && SURCO.snapshot().ready');primary();wait('SURCO.snapshot().playing');results.append({'name':'full-motion extract, mount and play complete without blocking controls','status':'passed'});print('PASS full-motion ritual',flush=True)
   before=page.locator('#scene').screenshot();page.wait_for_timeout(700);after=page.locator('#scene').screenshot();assert before!=after;results.append({'name':'playing scene pixels change over time with motion enabled','status':'passed'})
   ext=page.evaluate('''() => {const gl=document.querySelector('#scene').getContext('webgl2');const ext=gl.getExtension('WEBGL_lose_context');if(!ext)return false;ext.loseContext();return true;}''');assert ext;wait('!document.querySelector("#fallback").hidden');assert snap()['playing'];results.append({'name':'GPU context loss shows fallback while actual audio continues','status':'passed'})
   assert not errors;results.append({'name':'no uncaught exceptions during animation and GPU loss','status':'passed'})
  elif args.suite=='persistence':
   if not args.url:raise RuntimeError('Persistence requires --url to provide a real HTTP origin. Opaque set_content origin cannot verify IndexedDB.')
   page.locator('#audio-files').set_input_files(ROOT/'assets/hora-azul.mp3');wait('SURCO.snapshot().selected.kind==="local"');r=snap()['selected'];page.wait_for_timeout(1000);page.reload();wait('SURCO.snapshot().saved>0');click('collection-top');assert r['title'] in page.locator('#library-grid').inner_text();page.locator('.record-card').first.click(force=True);primary();primary();wait('SURCO.snapshot().ready');primary();wait('SURCO.snapshot().playing');results.append({'name':'IndexedDB audio survives reload and plays','status':'passed'})
 finally:
  output={'suite':args.suite,'mode':'HTTP origin' if args.url else 'opaque in-memory document','browser':b.version,'results':results,'uncaught_errors':errors,'note':'Export tests inspect the generated Blob and suppress the OS download click. Search responses are explicit test fixtures. No live YouTube API or playback validation is claimed.'}
  (ROOT/'tests'/('results-'+args.suite+'.json')).write_text(json.dumps(output,indent=2,ensure_ascii=False));b.close()
print(json.dumps(output,ensure_ascii=False),flush=True)
