#!/usr/bin/env python3
"""Assemble the static multi-page site from src/ and assets/. Run from the site root: python3 tools/build_pages.py"""
import re,hashlib,os,datetime
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));os.chdir(R)
rd=lambda p:open(p,encoding='utf-8').read()
BASE='https://uzoukwuericikenna.com'
NAME='Uzoukwu Eric Ikenna'
# slug: (nav label, <title>, description, [sections])
PAGES={
'index':('Home',NAME+' — Cybersecurity · Founder · Builder','Uzoukwu Eric Ikenna — Nigerian cybersecurity professional, serial founder, QA engineer and builder creating Africa-first technology solutions.',['home','about','skills','testimonials','booking','contact']),
'cybersecurity':('Cybersecurity','Cybersecurity | '+NAME,'Penetration testing, vulnerability assessments, incident response and security training by Uzoukwu Eric Ikenna, Founder of E World Fortress.',['cybersecurity']),
'webapps':('Web & App','Web & App Development | '+NAME,'Web and mobile products designed, built and shipped by Uzoukwu Eric Ikenna across fintech, health, commerce and education.',['webapps']),
'qa':('Quality Assurance','Quality Assurance | '+NAME,'Test strategy, automation and release QA across more than a dozen product ecosystems, led by Uzoukwu Eric Ikenna.',['qa']),
'pm':('Project Management','Project Management | '+NAME,'Product and project delivery, sprint planning and stakeholder management by Uzoukwu Eric Ikenna.',['pm']),
'ventures':('Ventures & Founding','Ventures & Founding | '+NAME,'The companies Uzoukwu Eric Ikenna has founded or co-founded: E World Fortress, 4First Technologies, Terbana, E World Technologies and more.',['ventures']),
'certifications':('Certifications','Certifications | '+NAME,'Professional certifications and training credentials held by Uzoukwu Eric Ikenna, including Cisco CyberOps Associate and Cisco Ethical Hacker.',['certifications']),
'speaking':('Speaking & Media','Speaking & Media | '+NAME,'Conference talks, radio, podcasts and online sessions by Uzoukwu Eric Ikenna on cybersecurity and technology in Africa.',['speaking']),
'casestudies':('Case Studies','Case Studies | '+NAME,'Deep dives into real security and product work delivered by Uzoukwu Eric Ikenna.',['casestudies']),
'blog':('Blog','Blog | '+NAME,'Articles on cybersecurity, startups and technology in Africa by Uzoukwu Eric Ikenna.',['blog']),
'events':('Events','Events | '+NAME,'Events, summits and community gatherings where Uzoukwu Eric Ikenna speaks or contributes.',['events']),
'booking':('Book a Meeting','Book a Meeting | '+NAME,'Book a call with Uzoukwu Eric Ikenna for consulting, speaking, training or partnership.',['booking']),
'contact':('Contact','Contact | '+NAME,'Get in touch with Uzoukwu Eric Ikenna in Owerri, Nigeria.',['contact']),
'cv':('CV','Request a CV | '+NAME,'Request a tailored CV of Uzoukwu Eric Ikenna: Cybersecurity, QA, Project Management and more.',['cv']),
}
NAVORDER=['cybersecurity','webapps','qa','pm','ventures','certifications','speaking','casestudies','blog','events','booking','contact']
HOME_ONLY=['about','skills','testimonials']
def url(slug): return '/' if slug=='index' else '/'+slug
def ver(p): return hashlib.md5(open(p,'rb').read()).hexdigest()[:8]
head=rd('src/head.html');pre=rd('src/pre.html');post=rd('src/post.html');gt=rd('src/gt-init.js').strip()
def rewrite(h,cur):
    h=h.replace('<a href="#home" class="skip-link">','<a href="#main" class="skip-link">')
    for s in list(PAGES)[1:]: h=h.replace('href="#%s"'%s,'href="/%s"'%s)
    h=h.replace('href="#home"','href="/"')
    for s in HOME_ONLY: h=h.replace('href="#%s"'%s,'href="%s#%s"'%('' if cur=='index' else '/',s))
    return h
def mark_active(h,cur):
    if cur=='index': return h
    return h.replace('href="/%s"'%cur,'href="/%s" class="active" aria-current="page"'%cur,1) if False else re.sub(r'(<a href="/%s")(>)'%cur,r'\1 class="active" aria-current="page"\2',h)
def sitemap():
    d=datetime.date.today().isoformat()
    u=''.join('  <url><loc>%s%s</loc><lastmod>%s</lastmod><priority>%s</priority></url>\n'%(BASE,'/' if s=='index' else '/'+s,d,'1.0' if s=='index' else '0.8') for s in PAGES)
    open('sitemap.xml','w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+u+'</urlset>\n')
cv,jv=ver('assets/styles.css'),ver('assets/app.js')
for slug,(label,title,desc,secs) in PAGES.items():
    h=head
    esc=lambda x:x.replace('&','&amp;')
    h=re.sub(r'<title>.*?</title>','<title>%s</title>'%esc(title),h,flags=re.S)
    h=re.sub(r'(<meta name="description" content=")[^"]*','\\g<1>'+esc(desc),h)
    h=re.sub(r'(<meta property="og:title" content=")[^"]*','\\g<1>'+esc(title),h)
    h=re.sub(r'(<meta property="og:description" content=")[^"]*','\\g<1>'+esc(desc),h)
    h=re.sub(r'(<meta name="twitter:title" content=")[^"]*','\\g<1>'+esc(title),h)
    h=re.sub(r'(<meta name="twitter:description" content=")[^"]*','\\g<1>'+esc(desc),h)
    h=re.sub(r'(<meta property="og:url" content=")[^"]*','\\g<1>'+BASE+('' if slug=='index' else '/'+slug),h)
    h=re.sub(r'(<link rel="canonical" href=")[^"]*','\\g<1>'+BASE+('' if slug=='index' else '/'+slug),h)
    pl='<link rel="preload" as="image" href="/img/hero-eric.webp" fetchpriority="high"/>\n' if slug=='index' else ''
    h+=pl+'<link rel="stylesheet" href="/assets/styles.css?v=%s"/>\n</head>\n<body>'%cv
    body=pre+'\n<main id="main" data-page="%s">\n'%slug+'\n'.join(rd('src/sections/%s.html'%x) for x in secs)+'\n</main>\n'+post
    body=rewrite(body,slug); body=mark_active(body,slug)
    if slug=='index':
        body=body.replace('<img src="/img/hero-eric.webp"','<img fetchpriority="high" decoding="async" src="/img/hero-eric.webp"',1)
    body=re.sub(r'<img (?![^>]*loading=)(?![^>]*fetchpriority)',r'<img loading="lazy" decoding="async" ',body)
    out=h+body+'\n<script>\n'+gt+'\n</script>\n<script src="//translate.googleapis.com/translate_a/element.js?cb=googleTranslateElementInit"></script>\n<script src="/assets/app.js?v=%s"></script>\n</body>\n</html>\n'%jv
    open(slug+'.html','w',encoding='utf-8').write(out)
    print(slug+'.html',len(out))
sitemap()
