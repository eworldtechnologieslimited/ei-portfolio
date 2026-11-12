# One-time split of the monolith into src/ pieces, assets/ and img/
import re,base64,io,hashlib,os
from PIL import Image
s=open('/home/claude/w/index.html',encoding='utf-8').read()

# 1. images -> /img
seen={}
def img(m):
    mime,data=m.group(1),m.group(2)
    if 'svg' in mime: return m.group(0)
    raw=base64.b64decode(data); h=hashlib.md5(raw).hexdigest()[:8]
    if h in seen: return seen[h]
    im=Image.open(io.BytesIO(raw)); 
    if im.mode not in('RGB','RGBA'): im=im.convert('RGBA' if 'transparency' in im.info else 'RGB')
    if max(im.size)>900: im.thumbnail((900,900))
    name='img/'+('hero-eric' if len(seen)==0 else 'logo-%02d'%len(seen))+'.webp'
    im.save(name,'WEBP',quality=68 if len(seen)==0 else 85,method=6)
    seen[h]='/'+name; return seen[h]
s=re.sub(r'data:image/([a-z+]+);base64,([A-Za-z0-9+/=]+)',img,s)
print('images',len(seen),sum(os.path.getsize('img/'+f) for f in os.listdir('img')))

# 2. css
m=re.search(r'<style>(.*?)</style>',s,re.S); css=m.group(1); s=s.replace(m.group(0),'',1)
m=re.search(r'<style id="pageViewCSS">.*?</style>',s,re.S); s=s.replace(m.group(0),'',1)
css+='''
/* multi-page layout */
main[data-page]:not([data-page="home"])>section:first-child{padding-top:7rem;min-height:70vh}
.nav-links{gap:.9rem;flex-wrap:wrap}.nav-links a{font-size:.52rem}
.mobile-menu{overflow-y:auto;justify-content:flex-start!important;padding-top:4.5rem!important;gap:1.1rem!important}
@media(max-width:900px){#infoBar{display:none!important}}
@media(max-width:1500px){.nav-links{display:none}.nav-hamburger{display:flex!important}}
'''
open('assets/styles.css','w',encoding='utf-8').write(css.strip()+'\n')

# 3. scripts
js=[];gt_init=None
def scr(m):
    global gt_init
    attrs,body=m.group(1),m.group(2)
    if 'src=' in attrs or 'ld+json' in attrs: return m.group(0)
    if 'googleTranslateElementInit' in body and len(body)<400: gt_init=body; return ''
    if '__route' in body: return ''
    js.append(body); return ''
s=re.sub(r'<script([^>]*)>(.*?)</script>',scr,s,flags=re.S)
s=re.sub(r'<script[^>]*translate[^>]*></script>','',s)   # external GT re-added at end of each page
open('assets/app.js','w',encoding='utf-8').write('\n'.join(js))
open('src/gt-init.js','w').write(gt_init)

# 4. head / pre / sections / post
head=s[:s.index('</head>')]
head=re.sub(r'<!-- Google Translate -->','',head)
open('src/head.html','w',encoding='utf-8').write(head)
body=s[s.index('<body>')+6:s.index('</body>')]
i=body.index('<div class="page active"')
open('src/pre.html','w',encoding='utf-8').write(body[:i])
ids=['home','about','cybersecurity','skills','webapps','qa','pm','ventures','certifications','speaking','events','testimonials','casestudies','blog','booking','cv','contact']
for x in ids:
    a=re.search(r'<section[^>]*\bid="%s"[^>]*>'%x,body).start(); e=body.index('</section>',a)+10
    open('src/sections/%s.html'%x,'w',encoding='utf-8').write(body[a:e])
n=body.index('<section class="section nl-section"')
post=body[n:]
open('src/post.html','w',encoding='utf-8').write(post)
print(len(head),len(body[:i]),len(post),len('\n'.join(js)))
