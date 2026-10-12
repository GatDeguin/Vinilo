"""Build the self-contained HTML with CSP hashes; Python 3 stdlib only."""
from pathlib import Path
import json, base64, hashlib
root=Path(__file__).parent
html=(root/'src/shell.html').read_text()
app=(root/'src/app.js').read_text()
audio={p.stem:'data:audio/mpeg;base64,'+base64.b64encode(p.read_bytes()).decode() for p in (root/'assets').glob('*.mp3')}
app=app.replace('/* AUDIO_PLACEHOLDER */',json.dumps(audio,separators=(',',':')))
parts={'CSS':(root/'src/style.css').read_text(),'CORE':(root/'src/core.js').read_text(),'MOTION':(root/'src/motion.js').read_text(),'RENDER':(root/'src/render.js').read_text(),'APP':app}
for k,s in parts.items():html=html.replace('/* '+k+'_PLACEHOLDER */',s)
hashes=['\'sha256-'+base64.b64encode(hashlib.sha256(parts[k].encode()).digest()).decode()+'\'' for k in ['CORE','MOTION','RENDER','APP']]
csp="default-src 'none'; script-src "+' '.join(hashes)+" https://www.youtube.com https://s.ytimg.com; style-src 'unsafe-inline'; img-src data: blob: https://i.ytimg.com; media-src data: blob:; connect-src https://www.googleapis.com https://www.youtube.com https://www.youtube-nocookie.com https://i.ytimg.com; frame-src https://www.youtube.com https://www.youtube-nocookie.com; object-src 'none'; base-uri 'none'; form-action 'none'"
html=html.replace('<!-- CSP_PLACEHOLDER -->','<meta http-equiv="Content-Security-Policy" content="'+csp+'">')
(root/'index.html').write_text(html)
print(f'Built {root/"index.html"}: {(root/"index.html").stat().st_size:,} bytes; {len(audio)} original recordings')
