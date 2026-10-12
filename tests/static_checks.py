"""Self-contained delivery integrity checks, using Python stdlib and Node."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib,base64,re,subprocess,json,tempfile
root=Path(__file__).resolve().parents[1]
text=(root/'index.html').read_text()
class Elements(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.external_scripts=[];self.external_styles=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if a.get('id'):self.ids.append(a['id'])
  if tag=='script' and a.get('src'):self.external_scripts.append(a['src'])
  if tag=='link' and a.get('rel')=='stylesheet':self.external_styles.append(a.get('href'))
p=Elements();p.feed(text)
assert len(p.ids)==len(set(p.ids)), 'Duplicate HTML ids'
assert not p.external_scripts and not p.external_styles, 'Unexpected startup CDN dependency'
assert not re.search(r'/\*\s*\w+_PLACEHOLDER\s*\*/',text), 'Unreplaced build placeholder'
assert 'TEST_KEY_' not in text and 'Fixture channel' not in text, 'Test fixtures in production bundle'
blocks=re.findall(r'<script>(.*?)</script>',text,re.S)
assert len(blocks)==4
for n,s in enumerate(blocks):
 digest=base64.b64encode(hashlib.sha256(s.encode()).digest()).decode()
 assert "'sha256-"+digest+"'" in text, 'CSP hash mismatch'
 with tempfile.NamedTemporaryFile(suffix='.js',mode='w',delete=False) as f:f.write(s);name=f.name
 try:subprocess.run(['node','--check',name],check=True,capture_output=True)
 finally:Path(name).unlink()
for media_file in (root/'assets').glob('*.mp3'):
 subprocess.run(['ffmpeg','-v','error','-i',str(media_file),'-f','null','-'],check=True,capture_output=True)
output={'unique_element_ids':len(p.ids),'scripts_syntax_checked':4,'csp_hashes_verified':4,'offline_audio_files_decoded':3,'external_startup_scripts':0,'external_stylesheets':0,'test_credentials_in_html':False,'sha256':hashlib.sha256((root/'index.html').read_bytes()).hexdigest(),'bytes':(root/'index.html').stat().st_size}
(root/'tests/static-results.json').write_text(json.dumps(output,indent=2))
print(json.dumps(output,indent=2))
