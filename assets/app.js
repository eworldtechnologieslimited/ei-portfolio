// ── SPEAKING DATA — indexed to match HTML card order ─────────────────────────


var SUPABASE_URL = 'YOUR_SUPABASE_URL';
var SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

// ── SUPABASE HELPER ──────────────────────────────────────────────────────────
async function sb(method,path,body){
  body=body||null;
  var opts={method:method,headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Content-Type':'application/json','Prefer':method==='POST'?'return=representation':''}};
  if(body)opts.body=JSON.stringify(body);
  var res=await fetch(SUPABASE_URL+'/rest/v1/'+path,opts);
  if(!res.ok)throw new Error(await res.text());
  var t=await res.text();return t?JSON.parse(t):[];
}

// ── ANALYTICS ────────────────────────────────────────────────────────────────
function getSessionId(){var k='eric_sid';var s=sessionStorage.getItem(k);if(!s){s=Math.random().toString(36).slice(2);sessionStorage.setItem(k,s);}return s;}
function trackEvent(type,meta){
  if(SUPABASE_URL==='YOUR_SUPABASE_URL')return;
  sb('POST','analytics_events',{event_type:type,page:window.location.pathname,session_id:getSessionId(),metadata:meta||{}}).catch(function(){});
}
function initTracking(){
  trackEvent('page_view');
  document.querySelectorAll('a[href$=".pdf"],a[href*="cv"],a[href*="resume"]').forEach(function(a){
    a.addEventListener('click',function(){trackEvent('cv_download');});
  });
}

// ── UTILS ────────────────────────────────────────────────────────────────────
function formatDate(d){if(!d)return'';var dt=new Date(d);return dt.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});}
function calcReadTime(content){if(!content)return'1 min';var words=content.replace(/<[^>]+>/g,'').split(/\s+/).length;return Math.max(1,Math.ceil(words/200))+' min';}

// ── REVEAL OBSERVER ──────────────────────────────────────────────────────────
function initReveal(){
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting)e.target.classList.add('visible');});
  },{threshold:0.1});
  document.querySelectorAll('.reveal').forEach(function(el){obs.observe(el);});
}

// ── NAV ──────────────────────────────────────────────────────────────────────
function toggleMenu(){
  var m=document.getElementById('mobileMenu');
  var o=document.getElementById('menuOverlay');
  if(m){m.classList.toggle('open');}
  if(o){o.classList.toggle('show');}
}
function closeMenu(){
  var m=document.getElementById('mobileMenu');
  var o=document.getElementById('menuOverlay');
  if(m)m.classList.remove('open');
  if(o)o.classList.remove('show');
}
window.addEventListener('scroll',function(){
  var nav=document.querySelector('nav');
  if(nav)nav.classList.toggle('scrolled',window.scrollY>50);
});

// ── BLOG ─────────────────────────────────────────────────────────────────────
var allPosts=[],currentCategory='all';
async function loadPosts(){
  var grid=document.getElementById('blogGrid');
  if(!grid)return;
  if(SUPABASE_URL==='YOUR_SUPABASE_URL'){renderPosts([]);return;}
  try{
    allPosts=await sb('GET','blog_posts?status=eq.published&order=published_at.desc&select=*');
    renderPosts(allPosts);
    loadCategories();
  }catch(e){renderPosts([]);}
}
function loadCategories(){
  var cats=['all'];
  allPosts.forEach(function(p){if(p.category&&cats.indexOf(p.category)<0)cats.push(p.category);});
  var bar=document.getElementById('blogCatBar');
  if(!bar)return;
  bar.innerHTML=cats.map(function(c){return'<button class="blog-cat-btn'+(c===currentCategory?' active':'')+'" onclick="filterBlog(\''+c+'\')">'+c+'</button>';}).join('');
}
function filterBlog(cat){
  currentCategory=cat;
  var filtered=cat==='all'?allPosts:allPosts.filter(function(p){return p.category===cat;});
  renderPosts(filtered);
  document.querySelectorAll('.blog-cat-btn').forEach(function(b){b.classList.toggle('active',b.textContent===cat);});
}
function renderPosts(posts){
  var grid=document.getElementById('blogGrid');
  if(!grid)return;
  if(!posts.length){grid.innerHTML='<p class="blog-empty">No posts yet. Check back soon.</p>';return;}
  grid.innerHTML=posts.map(function(p){
    var img=p.cover_image?'<img class="post-thumb" src="'+p.cover_image+'" alt="'+p.title+'" loading="lazy"/>':'';
    return'<div class="post-card" onclick="openPost('+p.id+')">'
      +img+'<div class="post-body"><div class="post-meta"><span class="post-cat">'+p.category+'</span><span>'+formatDate(p.published_at)+'</span><span>'+calcReadTime(p.content)+'</span></div>'
      +'<h3 class="post-title">'+p.title+'</h3>'
      +(p.excerpt?'<p class="post-excerpt">'+p.excerpt+'</p>':'')
      +'</div></div>';
  }).join('');
}
async function openPost(id){
  if(SUPABASE_URL==='YOUR_SUPABASE_URL')return;
  try{
    var posts=await sb('GET','blog_posts?id=eq.'+id+'&select=*');
    var p=posts[0];if(!p)return;
    var img=p.cover_image?'<img class="blog-modal-img" src="'+p.cover_image+'" alt="'+p.title+'"/>':'';
    var o=document.getElementById('blogModalOverlay');
    if(o){
      o.querySelector('#blogModalContent').innerHTML='<div class="blog-modal-meta"><span class="post-cat">'+p.category+'</span><span>'+formatDate(p.published_at)+'</span><span>'+calcReadTime(p.content)+'</span></div>'
        +'<h1 class="blog-modal-title">'+p.title+'</h1>'+img+'<div class="post-body">'+p.content+'</div>';
      var _sy3=window.scrollY;document.body.classList.add('modal-open');document.body.style.top='-'+_sy3+'px';o.classList.add('open');
      trackEvent('post_view',{post_id:id,title:p.title});
    }
  }catch(e){}
}
function closePostModal(){var o=document.getElementById('blogModalOverlay');if(o)o.classList.remove('open');document.documentElement.style.overflow='';document.body.style.overflow='';}

// ── EVENTS ───────────────────────────────────────────────────────────────────
var SEED_EVENTS=[
  {id:'ev-1',name:'Omniverse Research Exchange 2026',type:'Speaking',status:'past',date_start:'2026-06-02',date_end:'2026-06-05',location:'Lagos, Nigeria',organisation:'Omniverse Africa Summit 3.0',cover_image:'',short_description:'Fully funded physical presenter. Presented 4FG-Monitor and Verix platform to researchers and investors.',full_description:'<p>Fully funded presenter at <strong>Omniverse Research Exchange 2026</strong>, Omniverse Africa Summit 3.0 — funded by the German Federal Ministry of Research, Technology and Space.</p>',tags:['IoT','Research','Innovation','Fintech']},
  {id:'ev-2',name:'Trailblazer in Innovation Award',type:'Award Ceremony',status:'past',date_start:'2025',location:'Umunzu Town Hall, Njaba LGA, Imo State',organisation:'Umunzu Youth Organization',cover_image:'',short_description:'Awarded the Trailblazer in Innovation Award for contributions to digital growth and youth technology empowerment. Entirely unannounced.',full_description:'<p>Honoured with the <strong>Trailblazer in Innovation Award</strong> by the Umunzu Youth Organization for contributions to digital skills and cybersecurity in South-East Nigeria. Entirely unannounced.</p>',tags:['Award','Recognition','Innovation','Youth']},
  {id:'ev-3',name:'Umunzu Youth Organization Convention 2025',type:'Convention',status:'past',date_start:'2025-11-29',location:'Umunzu Town Hall, Njaba LGA, Imo State',organisation:'Umunzu Youth Organization',cover_image:'',short_description:'Speaker at Umunzu Youth Convention 2025. Session: The Digital Youth — Leveraging Technology for Global Relevance.',full_description:'<p>Invited speaker at the <strong>Umunzu Youth Organization Convention 2025</strong>. Session: <em>The Digital Youth: Leveraging Technology for Global Relevance</em>.</p>',tags:['Convention','Youth','Digital Skills']},
  {id:'ev-4',name:'Olu-Aka Institute — Graduation & Certificate Presentation',type:'Graduation',status:'past',date_start:'2024',location:'Owerri, Imo State',organisation:'Olu-Aka Institute of Technology',cover_image:'',short_description:'Returned to Olu-Aka Institute as certificate presenter, mentor, and talent scout after completing my own programme there.',full_description:'<p>Returned to <strong>Olu-Aka Institute of Technology</strong> as certificate presenter, mentor, and talent scout.</p>',tags:['Graduation','Mentorship','Education']},
  {id:'ev-5',name:'Founder Dojo Imo — Global Innovation Bootcamp',type:'Bootcamp',status:'past',date_start:'2024',location:'Owerri, Imo State',organisation:'Imo Digital City Ltd',cover_image:'',short_description:'Selected for Founder Dojo Imo — Silicon Valley-led bootcamp with UC Berkeley SCET and USMAC.',full_description:'<p><strong>Founder Participant</strong> at <strong>Founder Dojo Imo</strong>, with UC Berkeley SCET, USMAC and Imo Digital City Ltd. Mentored by Ken Singer, Christopher Burry, Steve Adelman and David Law.</p>',tags:['Bootcamp','Entrepreneurship','UC Berkeley']},
  {id:'ev-6',name:'Imo State Cybersecurity Community Meetups',type:'Community',status:'ongoing',date_start:'2024-07',location:'Owerri, Imo State',organisation:'Imo State Cybersecurity Community',cover_image:'',short_description:'Founded and lead a volunteer cybersecurity community with regular in-person workshops and mentorship.',full_description:'<p>Founded <strong>Imo State Cybersecurity Community (IMSCC)</strong> in July 2024. Regular in-person workshops, CTF practice, mentorship and security research projects.</p>',tags:['Community','Cybersecurity','Owerri']},
  {id:'ev-7',name:'Linux Systems & Security Labs',type:'Workshop',status:'ongoing',date_start:'2024-02',location:'Owerri, Imo State',organisation:'StreetHub Academy',cover_image:'',short_description:'7 hands-on Linux security labs training 10+ students in system hardening, Metasploit and Wireshark.',full_description:'<p>7 hands-on <strong>Linux Systems & Security Labs</strong> at StreetHub Academy. Covered Linux admin, privilege escalation, Wireshark and Metasploit. 10+ students trained.</p>',tags:['Linux','Workshop','Security']},
  {id:'ev-8',name:'Cybersecurity Bootcamps — Nigeria',type:'Bootcamp',status:'ongoing',date_start:'2023',location:'Owerri, Nigeria',organisation:'StreetHub Academy',cover_image:'',short_description:'Lead Instructor for 20+ in-person cybersecurity bootcamp sessions. 200+ professionals and students trained.',full_description:'<p>Lead Instructor for ongoing in-person cybersecurity bootcamps at <strong>StreetHub Academy</strong>. 20+ sessions, 200+ trained.</p>',tags:['Bootcamp','Cybersecurity','Training']}
];

var allEvents=[],currentEventFilter='all';
async function loadEvents(){
  var grid=document.getElementById('eventsGrid');
  if(!grid)return;
  try{
    var dbEvents=[];
    if(SUPABASE_URL!=='YOUR_SUPABASE_URL'){
      dbEvents=await sb('GET','events?order=date_start.desc&select=*').catch(function(){return[];});
    }
    allEvents=dbEvents.length?dbEvents:SEED_EVENTS;
    renderEvents(allEvents);
  }catch(e){allEvents=SEED_EVENTS;renderEvents(SEED_EVENTS);}
}
function renderEvents(events){
  var grid=document.getElementById('eventsGrid');
  if(!grid)return;
  if(!events.length){grid.innerHTML='<p style="font-family:var(--mono);font-size:.75rem;color:var(--muted)">No events yet.</p>';return;}
  window._evData=events;
  grid.innerHTML=events.map(function(ev,idx){
    var isPast=ev.status==='past';
    var img=ev.cover_image?'<img class="event-cover" src="'+ev.cover_image+'" alt="'+ev.name+'" loading="lazy"/>':'';
    return'<div class="event-card'+(isPast?' event-past':'')+'" onclick="openEventModal('+idx+')">'+img
      +'<div class="event-card-body">'
      +'<div class="event-type-badge">'+ev.type+'</div>'
      +'<div class="event-name">'+ev.name+'</div>'
      +'<div class="event-meta"> '+ev.date_start+(ev.date_end&&ev.date_end!==ev.date_start?' &ndash; '+ev.date_end:'')
      +(ev.location?' &nbsp;&middot;&nbsp;  '+ev.location:'')
      +(ev.organisation?' &nbsp;&middot;&nbsp;  '+ev.organisation:'')+'</div>'
      +(ev.short_description?'<p class="event-desc">'+ev.short_description+'</p>':'')
      +'<span class="event-status '+(isPast?'status-past':'status-upcoming')+'">'+ev.status+'</span>'
      +'<div class="event-view-details">View details &rarr;</div>'
      +'</div></div>';
  }).join('');
}
function filterEvents(filter,btn){
  currentEventFilter=filter;
  document.querySelectorAll('.event-filter-btn').forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
  var filtered=filter==='all'?allEvents:allEvents.filter(function(e){return e.status===filter;});
  renderEvents(filtered);
}

// ── SPEAKING ─────────────────────────────────────────────────────────────────

function closeSpeakModal() {
  var o = document.getElementById('speakModalOverlay');
  if (o) o.style.display = 'none';
  var wrap = document.getElementById('speakModalContent');
  if (wrap) wrap.scrollTop = 0;
};
var ASSESSMENTS = {
  vapt_interbank: {
    tag: 'Vulnerability Assessment & Penetration Testing',
    label: 'University of Johannesburg · Academic Project · Oct–Nov 2024',
    title: 'Interbank Switching Facility — VA & Risk Mitigation',
    outcomes: [{val:'40%',label:'Critical Vulns Reduced'},{val:'5',label:'High-Severity Findings'},{val:'3',label:'Systems Assessed'},{val:'100%',label:'Remediation Coverage'}],
    sections: [
      {h:'Overview', c:'<p>Conducted a comprehensive vulnerability assessment and penetration test on a live interbank switching facility — the infrastructure routing electronic financial transactions between banks in South Africa. The system processes millions of transactions daily and is a high-value target for advanced threat actors. The engagement required thorough assessment methodology while maintaining zero disruption to live financial operations.</p>'},
      {h:'Scope & Environment', c:'<ul><li><strong>Web Servers:</strong> Apache 2.4.41 running Drupal 9.0 — production environment with live transaction APIs</li><li><strong>Endpoints:</strong> Windows 7 (legacy, unsupported), Windows 10, and Windows 11 workstations across 3 departments</li><li><strong>Network:</strong> Segmented internal LAN, WPA3 enterprise WiFi, external-facing DMZ</li><li><strong>Active Directory:</strong> Full AD environment with 200+ users, 15 admin accounts, multiple OUs</li><li><strong>Database:</strong> MySQL 5.7 backing the transaction processing application</li></ul>'},
      {h:'Methodology', c:'<p><strong>Phase 1 — Recon:</strong> OSINT and passive fingerprinting. <strong>Phase 2 — Scanning:</strong> Nessus and OpenVAS across all in-scope systems. <strong>Phase 3 — Manual Testing:</strong> Burp Suite web app testing, BloodHound for AD enumeration, Metasploit for exploitation. <strong>Phase 4 — Report:</strong> CVSS v3.1 scoring with tiered remediation roadmap (immediate and strategic).</p>'},
      {h:'Key Findings', c:'<ul><li><strong>Critical — RCE on Legacy Endpoints:</strong> Windows 7 workstations exposed unpatched EternalBlue-family vulnerabilities. No compensating controls. Direct exploitation risk from internal and external vectors.</li><li><strong>High — SQL Injection:</strong> Primary transaction form field vulnerable to blind and error-based SQLi. Successful database schema extraction demonstrated severity.</li><li><strong>High — Stored XSS on Admin Portal:</strong> Drupal admin interface accepted unsanitised input persisting across sessions — presenting account takeover risk for privileged users.</li><li><strong>High — Active Directory Misconfiguration:</strong> Kerberoastable service accounts with weak passwords. Stale admin accounts active 18+ months post-departure. Excessive privilege assignments across user base.</li><li><strong>Medium — WPA3 WiFi Weakness:</strong> Enterprise WiFi using predictable PSK susceptible to offline dictionary attack.</li><li><strong>Medium — No EDR:</strong> Endpoint detection and response absent organisation-wide. Anti-malware outdated on 4 legacy endpoints.</li></ul>'},
      {h:'Remediation & Outcome', c:'<p><strong>Immediate (0–30 days):</strong> Isolate all Windows 7 systems, emergency patching for Critical/High CVEs, disable stale AD accounts, patch Apache/Drupal. <strong>Strategic (30–120 days):</strong> EDR deployment, AD hardening, WAF implementation, WiFi PSK rotation, OS modernisation programme. Result: Critical vulnerabilities reduced 40% within 30 days. Web vulnerabilities patched within 72 hours of report delivery.</p>'},
      {h:'Tools Used', c:'<p>Nessus &middot; OpenVAS &middot; Burp Suite Pro &middot; Metasploit &middot; BloodHound &middot; Nmap &middot; Wireshark &middot; Hashcat &middot; PowerShell &middot; Custom VA scripts</p>'}
    ]
  },
  ubuntu_audit: {
    tag: 'Compliance Audit · System Hardening',
    label: 'TryCyber University · Security Lab · 2024',
    title: 'Ubuntu 22.04 — DISA STIG Compliance Audit',
    outcomes: [{val:'DISA',label:'STIG Compliant'},{val:'3',label:'Critical Findings'},{val:'11',label:'Total Findings'},{val:'100%',label:'Remediated'}],
    sections: [
      {h:'Overview', c:'<p>Full DISA STIG compliance audit on an Ubuntu 22.04 LTS server in a simulated enterprise environment. Objective: identify all configuration deviations from DoD baseline security requirements, remediate all critical findings, and produce a before/after compliance report demonstrating full closure.</p>'},
      {h:'Audit Scope', c:'<ul><li>Authentication and password policy (PAM configuration, /etc/login.defs)</li><li>Filesystem permissions, world-writable files, SUID/SGID binaries</li><li>Audit logging via auditd for privileged command execution</li><li>SSH daemon hardening (protocol version, PermitRootLogin, MaxAuthTries)</li><li>Unnecessary services and open ports</li><li>Kernel security parameters via /etc/sysctl.conf</li></ul>'},
      {h:'Key Findings & Remediation', c:'<ul><li><strong>Critical — Weak Password Encryption:</strong> SHA-512 not enforced. /etc/login.defs using MD5. PAM pam_unix.so not configured to sha512. <em>Fix:</em> Updated ENCRYPT_METHOD to SHA512; configured pam_unix.so with sha512 flag and minimum 5000 rounds.</li><li><strong>Critical — World-Writable Files:</strong> 7 world-writable files in /tmp, /var/tmp, and /opt. <em>Fix:</em> Audited with find / -perm -0002; restored correct permissions (755/644) and ownership.</li><li><strong>Critical — Audit Logging Gaps:</strong> auditd not monitoring privileged command execution (sudo, su, chmod, chown). <em>Fix:</em> Comprehensive watch rules added to /etc/audit/rules.d/audit.rules targeting all privileged commands.</li><li><strong>High — SSH Root Login Permitted:</strong> PermitRootLogin set to yes. <em>Fix:</em> Set PermitRootLogin no and MaxAuthTries 3 in /etc/ssh/sshd_config.</li><li><strong>Medium — Unnecessary Services:</strong> Telnet, FTP, rsh installed but idle. <em>Fix:</em> Removed via apt purge; verified with systemctl and netstat.</li></ul>'},
      {h:'Post-Remediation', c:'<p>Re-ran DISA STIG scan post-remediation using OpenSCAP with the Ubuntu 22.04 STIG profile. All 11 findings remediated. Full DISA STIG compliance achieved. Before/after compliance report produced documenting each finding, remediation action taken, and verification result.</p>'},
      {h:'Tools Used', c:'<p>DISA STIG Viewer &middot; OpenSCAP &middot; Lynis &middot; auditd &middot; PAM &middot; Bash scripting &middot; Ubuntu 22.04 LTS</p>'}
    ]
  },
  forensics_hdrive: {
    tag: 'Digital Forensics · Incident Investigation',
    label: 'University of Johannesburg · Academic Investigation · 2024',
    title: 'Forensic Analysis of Hard Drive — Company X',
    outcomes: [{val:'100%',label:'Chain of Custody'},{val:'47',label:'Files Recovered'},{val:'3',label:'Hidden Accounts'},{val:'SA Law',label:'Court-Ready Report'}],
    sections: [
      {h:'Overview', c:'<p>Forensic investigation of a hard drive seized from a Company X workstation in a suspected insider threat case. Conducted under South Africa’s Cybercrime Act 2021. Objectives: recover deleted files, identify anti-forensic activity, uncover hidden accounts, and reconstruct a complete event timeline suitable for legal proceedings. All work performed on a verified forensic image to preserve original evidence integrity.</p>'},
      {h:'Evidence Acquisition', c:'<p>Created a bit-for-bit forensic image using dd with block-size optimisation. Generated MD5 and SHA-256 hashes of both the original drive and image to establish verified chain of custody. All subsequent analysis performed exclusively on the image. Evidence log maintained throughout documenting every access, tool invocation, and finding in sequence.</p>'},
      {h:'Investigation Findings', c:'<ul><li><strong>Deleted File Recovery:</strong> Autopsy file carving recovered 47 deleted documents from unallocated disk space — including 12 confidential financial records, 8 sensitive internal emails, and 27 project files deleted within 48 hours of the suspect’s notice period beginning.</li><li><strong>Anti-Forensic Activity Detected:</strong> CCleaner execution evidence found in Windows registry (MUICache, UserAssist). Manual log deletion confirmed via Windows Event Log gaps. Timestomping identified on 6 files — $MFT analysis revealed metadata modification timestamps inconsistent with filesystem creation dates.</li><li><strong>Hidden Accounts Discovered:</strong> Three shadow accounts with root-level privileges found in /etc/passwd and /etc/shadow on a dual-boot Linux partition. Created outside normal HR processes and absent from all Active Directory records.</li><li><strong>Timeline Reconstruction:</strong> Full event timeline built from $MFT, Windows registry artefacts (ShimCache, Prefetch), browser history, and recovered email timestamps. Timeline showed deliberate evidence destruction beginning 3 days before the suspect’s resignation was submitted.</li></ul>'},
      {h:'Legal & Compliance Context', c:'<p>Investigation conducted in full compliance with South Africa’s Cybercrime Act 2021. Evidence package structured to meet court admissibility standards: chain of custody documentation from seizure through analysis, hash verification at each stage, tool validation records, and analyst methodology certification. Final forensic report formatted for legal proceedings with executive summary, technical findings, and supporting artefact appendices.</p>'},
      {h:'Tools Used', c:'<p>Autopsy &middot; FTK Imager &middot; dd &middot; MD5/SHA-256 verification &middot; Sleuth Kit &middot; Volatility 3 &middot; RegRipper &middot; File carving &middot; Hex editor &middot; Wireshark</p>'}
    ]
  },
  network_assessment: {
    tag: 'Network Penetration Testing',
    label: 'University of Johannesburg · Simulated Corporate Network · 2024',
    title: 'Security Assessment — Simulated Corporate Network',
    outcomes: [{val:'12',label:'Vulnerabilities Found'},{val:'4',label:'Critical Findings'},{val:'DA',label:'Domain Admin Achieved'},{val:'100%',label:'Roadmap Delivered'}],
    sections: [
      {h:'Overview', c:'<p>Comprehensive black-box penetration test against a simulated corporate network environment modelled on a mid-sized financial services organisation. Objective: identify the maximum impact an unauthenticated external attacker could achieve against a realistic network topology including Active Directory, DMZ, web applications, and internal services.</p>'},
      {h:'Network Topology', c:'<ul><li>External-facing DMZ with web server and VPN gateway</li><li>Internal corporate LAN (192.168.1.0/24) with 24 hosts</li><li>Active Directory domain (CORP.LOCAL) with 150+ user accounts</li><li>Database servers on isolated VLAN (192.168.2.0/24)</li><li>Legacy segment with Windows XP and Windows 7 workstations</li></ul>'},
      {h:'Attack Chain', c:'<ul><li><strong>External Recon:</strong> Nmap discovery. Nikto revealed Apache version disclosure and an exposed /admin path. Dirbuster uncovered a legacy phpMyAdmin panel.</li><li><strong>Initial Access:</strong> Default credentials on phpMyAdmin (root:root) granted database access. SQL injection on login portal provided a secondary access vector.</li><li><strong>Privilege Escalation:</strong> Kerberoasting via Impacket GetUserSPNs.py yielded 3 service account tickets. Hashcat cracked 2 within 4 minutes using rockyou.txt.</li><li><strong>Lateral Movement:</strong> Pass-the-hash with cracked credentials. SMB relay via Responder on LLMNR-enabled network. BloodHound mapped the shortest path to Domain Admin.</li><li><strong>Domain Compromise:</strong> DCSync attack using Mimikatz extracted all domain password hashes. Domain Admin achieved. Golden ticket forged for persistence demonstration.</li></ul>'},
      {h:'Key Vulnerabilities', c:'<ul><li><strong>Critical — Default Credentials:</strong> phpMyAdmin, network printer, and 2 switches using factory-default passwords.</li><li><strong>Critical — Kerberoastable Accounts:</strong> Service accounts with SPNs and weak passwords. No AES encryption enforced.</li><li><strong>Critical — LLMNR/NBT-NS Enabled:</strong> Network poisoning via Responder captured NTLMv2 hashes within 60 seconds of connection.</li><li><strong>Critical — Unpatched Legacy Systems:</strong> Windows XP (EternalBlue) and Windows 7 (MS17-010) with no compensating controls.</li><li><strong>High — Excessive AD Privileges:</strong> 12 standard users with local admin rights on all workstations.</li><li><strong>Medium — Flat Network:</strong> No segmentation allowed unrestricted lateral movement post-compromise.</li></ul>'},
      {h:'Remediation Roadmap', c:'<p><strong>Week 1:</strong> Rotate all service account passwords to 25+ char random strings. Disable LLMNR/NBT-NS via GPO. Change all default credentials. <strong>Month 1:</strong> Patch or isolate legacy systems. Enforce AES for Kerberos. Remove excessive local admin rights. <strong>Quarter 1:</strong> Deploy network segmentation. Implement PAM solution. Establish vulnerability management programme.</p>'},
      {h:'Tools Used', c:'<p>Nmap &middot; Nikto &middot; Dirbuster &middot; Metasploit &middot; Responder &middot; Impacket &middot; BloodHound &middot; Mimikatz &middot; Hashcat &middot; Burp Suite &middot; CrackMapExec</p>'}
    ]
  },
  tomcat_compromise: {
    tag: 'SOC Investigation · PCAP Analysis',
    label: 'Blue Team Lab · Attack Chain Reconstruction · 2024',
    title: 'Apache Tomcat Web Server Compromise',
    outcomes: [{val:'6',label:'Attack Stages Mapped'},{val:'1',label:'Attacker Identified'},{val:'PCAP',label:'Full Chain in Evidence'},{val:'100%',label:'Chain Reconstructed'}],
    sections: [
      {h:'Overview', c:'<p>Blue team forensic investigation of a compromised Apache Tomcat server. A 4-hour network PCAP capture was provided spanning the compromise window. Objective: reconstruct the complete attack chain from initial reconnaissance through persistent access, identify the attacker, and produce an evidence package suitable for disciplinary or legal action.</p>'},
      {h:'Attack Chain Reconstruction', c:'<ul><li><strong>Stage 1 — Recon (T1595):</strong> Systematic Gobuster directory enumeration from 192.168.1.105. 847 HTTP GET requests over 12 minutes targeting /manager/html, /manager/text, and /host-manager paths.</li><li><strong>Stage 2 — Credential Brute-Force (T1110):</strong> 47 HTTP POST requests to /manager/html with Basic Auth. Hydra tool signature detected in User-Agent. Default credential tomcat:tomcat succeeded on attempt 23. HTTP 200 response confirmed access.</li><li><strong>Stage 3 — Malicious WAR Upload (T1505.003):</strong> HTTP PUT submitted cmd.war to Tomcat manager. WAR contained a JSP web shell (cmd.jsp). Shell accepted GET parameter ?cmd= for OS command execution.</li><li><strong>Stage 4 — RCE (T1059):</strong> Series of GET requests to /cmd/cmd.jsp?cmd= executing id, whoami, cat /etc/passwd, uname -a. Outbound TCP to 192.168.1.200:4444 — Meterpreter reverse shell confirmed by payload signature in PCAP.</li><li><strong>Stage 5 — Persistence (T1547, T1136):</strong> Cron job added for reverse shell every 5 minutes. New Tomcat admin account sysadm created in conf/tomcat-users.xml with manager-gui role.</li><li><strong>Stage 6 — Attacker Identified:</strong> Source IP 192.168.1.105 traced via DHCP logs to internal workstation WS-FINANCE-07. MAC address cross-referenced with asset register. Active Directory login timestamps correlated the attack window to a specific user session.</li></ul>'},
      {h:'Evidence Package', c:'<p>Delivered: (1) Annotated PCAP with attack timeline markers, (2) Extracted WAR file and decompiled JSP shell with analysis, (3) Attacker identification report with DHCP/AD correlation, (4) MITRE ATT&amp;CK mapping (T1595, T1110, T1505.003, T1059, T1547, T1136), (5) Remediation checklist covering credential rotation, WAR removal, cron cleanup, and account lockout.</p>'},
      {h:'Tools Used', c:'<p>Wireshark &middot; NetworkMiner &middot; Tshark &middot; jd-gui (Java decompiler) &middot; CyberChef &middot; Log correlation &middot; MITRE ATT&amp;CK Navigator</p>'}
    ]
  },
  malicious_ip: {
    tag: 'Incident Response · SOC Tier 1',
    label: 'Blue Team · Threat Intelligence · SOC Operations · 2024',
    title: 'Incident Response — Malicious IP Blocking',
    outcomes: [{val:'100%',label:'IP Confirmed Malicious'},{val:'<1hr',label:'Detection to Block'},{val:'0',label:'Data Breach Confirmed'},{val:'P1',label:'Incident Priority'}],
    sections: [
      {h:'Overview', c:'<p>Tier 1 SOC triage and response to a SIEM alert flagging a successful authentication from a geographically anomalous IP address. Alert triaged, threat intelligence gathered, session analysed for impact, remediation applied, and the full incident documented and escalated — all within 47 minutes of the initial alert firing.</p>'},
      {h:'Alert & Triage', c:'<p>SIEM alert: successful login to a service account (svc-monitoring) from IP 45.227.255.99 at 02:14 UTC — outside all normal business hours, from a country with no registered users. Alert confirmed genuine (not a false positive). Source IP was outside the approved IP allowlist. Account had limited but non-zero system access.</p>'},
      {h:'Threat Intelligence', c:'<ul><li><strong>AbuseIPDB:</strong> 100% malicious confidence. 847 abuse reports over 90 days. Associated with credential stuffing campaigns targeting financial services APIs.</li><li><strong>Cisco Talos:</strong> IP blacklisted. Categorised as a botnet C2 node. Last seen active 6 hours before the login event.</li><li><strong>VirusTotal:</strong> 14/80 security vendors flagged the IP. Associated with Mirai botnet variant infrastructure.</li><li><strong>MaxMind GeoIP:</strong> IP resolves to China Mobile AS network. Organisation has no staff or partners in that region.</li><li><strong>Internal logs:</strong> IP had zero prior appearance in 90-day SIEM logs — targeted credential use rather than opportunistic scanning.</li></ul>'},
      {h:'Impact Assessment', c:'<p>Full session review: the svc-monitoring account performed 3 read-only API calls (GET /api/v1/system/status, /api/v1/metrics/current, /api/v1/alerts/list) before the connection terminated. No write operations. No lateral movement detected. No data exfiltration confirmed. Blast radius: low — monitoring endpoints exposed, but no sensitive data accessible via that account’s permissions.</p>'},
      {h:'Remediation Actions', c:'<ul><li>IP 45.227.255.99 blocked at perimeter firewall and WAF within 8 minutes of alert</li><li>Geo-blocking rule added for all ASNs registered to China Mobile</li><li>svc-monitoring account password rotated to 32-char random string; prior credentials invalidated</li><li>MFA enforced on all service accounts (previously optional)</li><li>IP added to internal threat intelligence blocklist, pushed to all security tooling</li><li>Incident escalated to Tier 2 for post-incident review and root cause analysis</li></ul>'},
      {h:'Lessons Learned', c:'<p>Service accounts should not be reachable via external-facing authentication endpoints. Password rotation for service accounts reduced from 90 to 30 days. Geo-based anomaly detection rules added to SIEM for all privileged account logins. MFA gap on service accounts closed organisation-wide.</p>'},
      {h:'Tools Used', c:'<p>SIEM &middot; AbuseIPDB &middot; Cisco Talos &middot; VirusTotal &middot; MaxMind GeoIP &middot; Firewall console &middot; PAM system</p>'}
    ]
  },
  rtf_malware: {
    tag: 'Malware Analysis · CVE-2017-11882',
    label: 'Blue Team · Static & Dynamic Analysis · 2024',
    title: 'CVE-2017-11882 — Malicious RTF Document Analysis',
    outcomes: [{val:'CVE',label:'2017-11882 Confirmed'},{val:'100%',label:'Payload Decoded'},{val:'7',label:'IOCs Extracted'},{val:'YARA',label:'Rule Written'}],
    sections: [
      {h:'Overview', c:'<p>Static and dynamic malware analysis of a malicious RTF document exploiting CVE-2017-11882 — the Microsoft Equation Editor stack buffer overflow vulnerability. The sample arrived as a suspected phishing attachment. Objective: fully reverse-engineer the exploit chain, identify the payload, extract all indicators of compromise, and write a YARA detection rule to identify similar samples in the environment.</p>'},
      {h:'Static Analysis', c:'<ul><li><strong>File triage:</strong> VirusTotal submission — 38/60 vendor detections. File type confirmed as RTF via magic bytes (7B 5C 72 74 66).</li><li><strong>RTF structure:</strong> rtfdump.py extracted 6 embedded OLE objects. Object 4 identified as the exploit payload — unusual objclass Equation.3 header, characteristic of Equation Editor exploitation.</li><li><strong>Shellcode extraction:</strong> OLE object 4 parsed with OleTools. Shellcode extracted as 186-byte binary blob. Hex analysis revealed URLDownloadToFileA API hash and XOR-encoded URL string.</li><li><strong>URL decoded:</strong> XOR key 0x41 applied to decode download URL: hxxp://185.220.101[.]47/update.exe</li></ul>'},
      {h:'Dynamic Analysis', c:'<ul><li><strong>Sandbox detonation:</strong> Any.run sandbox (Windows 10, Office 2016 unpatched). EQNEDT32.EXE spawned on document open — shellcode executed immediately, confirmed by cmd.exe child process creation.</li><li><strong>Network behaviour:</strong> Wireshark captured HTTP GET to 185.220.101[.]47/update.exe within 3 seconds. 847KB PE file downloaded to system temp folder.</li><li><strong>Payload analysis:</strong> Downloaded PE identified as Formbook infostealer. Keylogger hooks established. Browser credential harvesting from Chrome and Firefox profile directories. C2 beaconing every 60 seconds via HTTP POST with base64-encoded stolen data.</li><li><strong>Persistence:</strong> Registry Run key added: HKCU/SOFTWARE/Microsoft/Windows/CurrentVersion/Run pointing to the dropped executable for startup persistence.</li></ul>'},
      {h:'Indicators of Compromise', c:'<ul><li>C2 IP: 185.220.101[.]47 — block at firewall and web proxy</li><li>Download URL: hxxp://185.220.101[.]47/update.exe</li><li>Registry persistence: HKCU/SOFTWARE/Microsoft/Windows/CurrentVersion/Run</li><li>Dropped executable in system temp directory</li><li>HTTP POST to /submit.php every 60 seconds (C2 beacon)</li><li>File hash (MD5 and SHA-256) of both RTF and dropped payload</li><li>Network beacon User-Agent string mismatch</li></ul>'},
      {h:'YARA Rule & Remediation', c:'<p>YARA rule written to detect the exploit RTF by Equation Editor object signature and XOR-encoded URL pattern. Rule submitted to internal threat intelligence platform and pushed to endpoint detection tooling. Recommendations: patch EQNEDT32.EXE (KB4011604) or disable Equation Editor via registry; block C2 IP at perimeter; deploy YARA rule to email gateway scanning.</p>'},
      {h:'Tools Used', c:'<p>VirusTotal &middot; Any.run sandbox &middot; rtfdump.py &middot; OleTools &middot; scdbg &middot; x64dbg &middot; Wireshark &middot; CyberChef &middot; YARA &middot; PEStudio</p>'}
    ]
  },
  qradar_soc: {
    tag: 'SIEM Investigation · Insider Threat',
    label: 'Blue Team Lab · IBM QRadar · Financial Company · 2024',
    title: 'QRadar SIEM — Insider Threat Investigation',
    outcomes: [{val:'15',label:'Log Sources Correlated'},{val:'6',label:'ATT&CK Techniques'},{val:'2',label:'Threat Actors Found'},{val:'Full',label:'Chain Mapped'}],
    sections: [
      {h:'Overview', c:'<p>Full threat hunting and incident investigation using IBM QRadar SIEM against a complex multi-stage attack on a financial company. The environment included 15 active log sources: Suricata IDS/IPS, Windows Event Logs, Cisco ASA firewall, endpoint telemetry, and Active Directory audit logs across the hackdefend.local domain. The investigation uncovered both an external threat actor and an insider accomplice.</p>'},
      {h:'Attack Chain Stage-by-Stage', c:'<ul><li><strong>T1566 — Phishing (Initial Access):</strong> Unusual attachment download event correlated for user nour. File: important_instructions.docx (malicious macro). Email gateway logs confirmed delivery from spoofed HR address at 09:14 UTC.</li><li><strong>T1566 — Attacker IP:</strong> 192.20.80.25 — Suricata generated 3 high-priority alerts. VirusTotal: associated with credential harvesting infrastructure active 8 months.</li><li><strong>T1021 — Lateral Movement:</strong> wmiexec.py execution detected via Windows Security Event 4688 on 3 internal hosts. ICMP discovery scan of 192.168.20.0/24 flagged by Suricata rule ET SCAN.</li><li><strong>T1547.001 — Persistence:</strong> Registry modification detected via Sysmon Event ID 13. New account rambo created with local admin membership (Events 4720, 4732).</li><li><strong>T1055 — Process Injection:</strong> Sysmon Event ID 8 (CreateRemoteThread) detected. Code injected into PID 7384 (svchost.exe). Correlated with unusual svchost child process creation.</li><li><strong>T1041 — Exfiltration:</strong> Network flow logs showed curl.exe POST to 192.20.80.25:443 with file sami.xlsx attached. File confirmed sensitive via DLP correlation.</li></ul>'},
      {h:'Insider Threat Discovery', c:'<p>Cross-correlation of HR badge access logs, financial transaction records showing unusual account queries at 02:00–03:00 UTC, Active Directory audit of out-of-scope file access by employee sami, and prior disciplinary records revealed both technical access and financial motive. Communication metadata provided additional corroboration. Evidence indicated sami contracted the external attacker. Both actors documented with full evidential corroboration for legal proceedings.</p>'},
      {h:'MITRE ATT&amp;CK Mapping', c:'<p>Full kill chain: T1566 (Phishing) &rarr; T1021 (Remote Services) &rarr; T1547.001 (Boot Autostart Execution) &rarr; T1055 (Process Injection) &rarr; T1041 (Exfiltration over C2). Additional: T1087 (Account Discovery), T1018 (Remote System Discovery), T1078 (Valid Accounts).</p>'},
      {h:'Deliverables', c:'<ul><li>Full incident timeline (17.5-hour attack window, 09:14 UTC through 02:47 UTC next day)</li><li>MITRE ATT&amp;CK Navigator layer file with all 7 techniques annotated</li><li>QRadar custom offense rules to detect similar lateral movement patterns</li><li>Evidence package for HR and legal proceedings</li><li>Post-incident recommendations: enforce MFA, deploy DLP on file transfer, implement UEBA, restrict wmiexec/PsExec via GPO</li></ul>'},
      {h:'Tools Used', c:'<p>IBM QRadar SIEM &middot; Suricata IDS/IPS &middot; Windows Event Viewer &middot; Sysmon &middot; VirusTotal &middot; MaxMind &middot; MITRE ATT&amp;CK Navigator</p>'}
    ]
  },
  soc_anz: {
    tag: 'Virtual Experience · SOC Analysis',
    label: 'Forage · ANZ Australia · Feb 2024',
    title: 'ANZ — SOC Cyber Management Virtual Experience',
    outcomes: [{val:'2',label:'Investigation Tasks'},{val:'5',label:'IoCs Identified'},{val:'DNS',label:'Tunnelling Detected'},{val:'100%',label:'Programme Completed'}],
    sections: [
      {h:'Overview', c:'<p>Completed ANZ Australia’s SOC Cyber Management Virtual Experience programme on Forage, simulating the role of a Tier 1 SOC analyst across two core investigation tasks: email threat analysis and network forensics via live PCAP analysis. Demonstrated multi-vector threat identification, IOC extraction, and structured investigation reporting.</p>'},
      {h:'Task 1 — Email Threat Analysis', c:'<ul><li><strong>Dataset:</strong> 5 suspicious emails forwarded from staff. Each analysed for sender domain spoofing, SPF/DKIM/DMARC alignment, embedded URL reputation, attachment signatures, and social engineering tactics.</li><li><strong>Phishing (3 emails):</strong> Spoofed sender domains using lookalike characters. Embedded URLs redirected through a 2-hop chain to a credential harvesting page mimicking ANZ internet banking. HTML attachment contained obfuscated JavaScript auto-redirect.</li><li><strong>Business Email Compromise (2 emails):</strong> CEO impersonation requesting urgent wire transfer. No malicious links or attachments — pure social engineering. Identified via display name vs reply-to address mismatch and urgency language patterns.</li><li><strong>IOCs extracted:</strong> 3 malicious domains, 2 C2 IP addresses, 1 file hash (HTML attachment), 2 BEC sender addresses. All submitted to threat intelligence platform.</li></ul>'},
      {h:'Task 2 — Network PCAP Forensics', c:'<ul><li><strong>DNS Tunnelling:</strong> Abnormally long DNS query strings (avg 127 chars vs normal 15). Query patterns encoded data in subdomain labels. Tool signature: iodine DNS tunnel (characteristic TXT record patterns). ~2.3MB estimated to have been exfiltrated over 45 minutes via DNS.</li><li><strong>Lateral Movement:</strong> Compromised host scanning 192.168.1.0/24 on port 445. Access to 3 file shares on separate hosts — consistent with SMB propagation behaviour.</li><li><strong>C2 Beaconing:</strong> Regular 60-second HTTP POST intervals to 198.51.100.23:8080. User-Agent string mismatch (IE/6.0 on a Windows 11 host). Base64-encoded payload. Confirmed C2 communication pattern.</li><li><strong>Credentials in Cleartext:</strong> HTTP (not HTTPS) login sequence captured. Username and password visible in plaintext POST body — corporate policy violation and direct credential exposure risk.</li></ul>'},
      {h:'Outcome', c:'<p>Programme completed with all task submissions. Demonstrated Tier 1 SOC capability across email and network domains: phishing identification, BEC recognition, DNS tunnelling detection, C2 beaconing analysis, and structured IOC reporting. Skills directly applicable to a real-world SOC analyst role.</p>'},
      {h:'Tools Used', c:'<p>Wireshark &middot; NetworkMiner &middot; VirusTotal &middot; MXToolbox &middot; Email header analysis &middot; Base64/CyberChef &middot; DNS analysis tools &middot; SIEM simulation</p>'}
    ]
  },
  pwc_advisory: {
    tag: 'Virtual Experience · Cybersecurity Advisory',
    label: 'Forage · PwC Switzerland · Dec 2023',
    title: 'PwC Switzerland — Cybersecurity Advisory Simulation',
    outcomes: [{val:'14',label:'Risks Identified'},{val:'Zero',label:'Trust Architecture'},{val:'3-Tier',label:'Network Designed'},{val:'Full',label:'Executive Report'}],
    sections: [
      {h:'Overview', c:'<p>Completed PwC Switzerland’s Cybersecurity Advisory virtual experience on Forage, simulating a cybersecurity consultant on a real advisory engagement. Tasks included integrated security risk assessment, network segmentation architecture design, zero-trust model development, and delivery of a board-level risk report with a 12-month implementation roadmap.</p>'},
      {h:'Task 1 — Security Risk Assessment', c:'<ul><li>ISO 27001-aligned assessment covering people, process, and technology domains. Risks scored by likelihood (1–5) × business impact (1–5).</li><li><strong>People (5 risks):</strong> Inadequate security awareness, insider threat via privileged access, social engineering susceptibility, unclear IR responsibilities, contractor access controls.</li><li><strong>Process (4 risks):</strong> Outdated patch management policy, no formal change management, missing data classification framework, IR plan not tested in 24+ months.</li><li><strong>Technology (5 risks):</strong> Flat network architecture, no MFA on remote access, unencrypted data at rest, legacy systems out of support lifecycle, no DLP on email/cloud storage.</li></ul>'},
      {h:'Task 2 — Network Segmentation', c:'<ul><li><strong>DMZ (Tier 1):</strong> Public-facing services (web servers, email gateway, VPN). Strict ingress/egress filtering. No direct access to corporate LAN.</li><li><strong>Corporate LAN (Tier 2):</strong> User workstations and general business services. Limited Tier 3 access based on role and device posture.</li><li><strong>Critical Infrastructure (Tier 3):</strong> Database servers, ERP, backup systems. Accessible only via jump host with MFA. No direct internet egress.</li><li>Firewall rules, VLAN configuration, and IDS/IPS placement documented for each tier boundary.</li></ul>'},
      {h:'Task 3 — Zero-Trust Architecture', c:'<p>Designed a zero-trust model based on NIST SP 800-207: identity-centric access decisions (verified identity + device posture + context), never-trust-always-verify for all traffic (including east-west), least-privilege with JIT elevation for privileged tasks, micro-segmentation preventing lateral movement from any compromised endpoint, and continuous UEBA-driven monitoring for all user and device behaviour.</p>'},
      {h:'Executive Report', c:'<p>Produced a 12-page board-level risk report: 14-item risk register (RAG-rated), remediation priority matrix, 12-month implementation roadmap with ownership and resource estimates, and an executive summary communicating technical risk in business impact language suitable for board presentation.</p>'},
      {h:'Tools & Frameworks', c:'<p>ISO 27001 &middot; NIST CSF &middot; NIST SP 800-207 (Zero Trust) &middot; Risk matrix &middot; Network diagram tools &middot; MITRE ATT&amp;CK (threat mapping)</p>'}
    ]
  },
  mastercard_awareness: {
    tag: 'Virtual Experience · Security Awareness',
    label: 'Forage · Mastercard · Dec 2023',
    title: 'Mastercard — Security Awareness Analyst',
    outcomes: [{val:'5',label:'Business Units Assessed'},{val:'3',label:'Phishing Templates'},{val:'23%',label:'Avg Click Rate'},{val:'100%',label:'Programme Designed'}],
    sections: [
      {h:'Overview', c:'<p>Completed Mastercard’s Security Awareness Analyst virtual experience on Forage. Designed phishing simulations, assessed security readiness across 5 business units, and developed targeted training programmes mapped to identified risk patterns. Focused on translating threat intelligence into actionable, human-centred security interventions.</p>'},
      {h:'Task 1 — Phishing Simulation Design', c:'<ul><li><strong>Template 1 — IT Support Impersonation:</strong> Email appearing to be from IT helpdesk requesting credential reset. Lure: account access expiring in 24 hours. Targeted non-technical staff. Highest expected click rate due to urgency + authority combination.</li><li><strong>Template 2 — Invoice Fraud:</strong> Email appearing to be from Finance with a fake invoice PDF. Attachment triggered a web beacon on open. Targeted Finance and Procurement teams.</li><li><strong>Template 3 — Executive Request Spoofing (BEC):</strong> C-suite impersonation requesting urgent action. No malicious links or attachments — pure social engineering targeting Executive Assistants and Finance approval staff.</li></ul>'},
      {h:'Task 2 — Business Unit Assessment', c:'<ul><li><strong>Technology:</strong> 8% click rate. Highest awareness. 67% reporting rate — most staff reported the phish rather than clicking.</li><li><strong>Finance:</strong> 34% click rate. Highest susceptibility to invoice fraud. Only 12% reporting rate.</li><li><strong>Operations:</strong> 21% click rate. Susceptible to IT support impersonation. 28% reporting rate.</li><li><strong>Marketing:</strong> 19% overall. Executive spoofing template achieved 29% in this BU.</li><li><strong>HR:</strong> 31% click rate. High susceptibility across all 3 templates. No prior simulation experience.</li></ul>'},
      {h:'Task 3 — Training Programme', c:'<ul><li><strong>Finance & HR (high-risk):</strong> Mandatory 45-minute module on invoice fraud, BEC, and credential phishing. Quarterly repeat simulations. Escalation-first culture training (verify via phone before acting on email requests).</li><li><strong>Operations:</strong> 30-minute module on IT helpdesk impersonation and credential hygiene. Simulated helpdesk scenarios.</li><li><strong>All BUs:</strong> 15-minute universal baseline covering phishing recognition, reporting procedures, and password hygiene. Integrated into onboarding for new starters.</li><li><strong>Metrics:</strong> Click rate, reporting rate, and simulation improvement tracked per BU quarterly. Dashboard designed to surface high-risk individuals for targeted follow-up.</li></ul>'},
      {h:'Outcome', c:'<p>Programme completed with all deliverables submitted. Demonstrated ability to design multi-vector phishing simulations, perform quantitative security awareness assessment, identify risk by business unit, and design targeted training interventions mapped to specific threat patterns. Directly applicable to building or running a security awareness function from the ground up.</p>'},
      {h:'Tools', c:'<p>Phishing simulation platform &middot; Security awareness training design &middot; Risk assessment matrix &middot; KnowBe4 methodology &middot; Human risk quantification</p>'}
    ]
  },
  reverse_eng: {
    tag: 'Reverse Engineering · Binary Analysis',
    label: 'Flare-On Challenge · Windows PE Analysis · 2024',
    title: 'Reverse Engineering — Windows Binary (Flare-On)',
    outcomes: [{val:'IDA',label:'Pro Static Analysis'},{val:'Custom',label:'Base64 Decoded'},{val:'Flag',label:'Successfully Recovered'},{val:'Anti',label:'Debug Bypass'}],
    sections: [
      {h:'Overview', c:'<p>Reverse-engineered a Windows PE executable from the Flare-On malware analysis challenge. The binary implemented a custom Base64 encoding scheme using a non-standard character set to obscure a hidden flag. Used IDA Pro for static disassembly, x64dbg for dynamic analysis, and wrote a Python script implementing the custom decode algorithm. Successfully recovered the hidden flag after bypassing an anti-debugging check.</p>'},
      {h:'Static Analysis — IDA Pro', c:'<ul><li><strong>Binary profile:</strong> 32-bit Windows PE, compiled with MSVC, no packer (PEStudio). Imports: kernel32.dll (basic), msvcrt.dll (string functions). No network imports.</li><li><strong>Entry point:</strong> Standard MSVC CRT startup. Main function at 0x401000. Two primary subroutines: sub_401050 (encoding/decoding) and sub_4010C0 (string comparison/validation).</li><li><strong>Custom charset extraction:</strong> sub_401050 references a 64-byte lookup table in .rodata at 0x403000. Table: qrstuvwxyz+/ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop0123456789 — a permuted Base64 alphabet.</li><li><strong>Anti-debug check:</strong> IsDebuggerPresent() called at 0x401020. If debugger detected, returns immediately with invalid result. Bypassed by NOPing the JNZ instruction at 0x401027 (75 05 replaced with 90 90).</li></ul>'},
      {h:'Dynamic Analysis — x64dbg', c:'<ul><li>Loaded binary in x64dbg. Applied NOP patch at 0x401027 to bypass the anti-debug check.</li><li>Breakpoint set at custom Base64 decode routine (sub_401050). Observed input string decoded one character at a time using the custom charset lookup table.</li><li>Sysinternals Process Monitor: binary reads key.txt from the same directory. If absent, uses a hardcoded encoded string from the .data section at 0x402000.</li><li>Final decoded output (40 bytes) passed to strcmp at 0x4010C0. A match triggers the success message; mismatch triggers a failure message.</li></ul>'},
      {h:'Python Decode Script', c:'<p>Python script implementing the custom Base64 decode. A translation table was built mapping the custom charset to the standard Base64 charset character-by-character. Standard base64.b64decode applied to the translated string. Successfully decoded the 40-byte flag from the encoded string extracted from the binary’s .data section. The flag was recovered in under 10 minutes of scripting after the charset extraction.</p>'},
      {h:'Skills Demonstrated', c:'<ul><li>PE binary analysis and import table inspection</li><li>x86 assembly reading and control flow analysis in IDA Pro</li><li>Anti-debugging technique identification and bypass via instruction patching</li><li>Custom encoding scheme reverse-engineering from disassembly</li><li>Python scripting for crypto/encoding analysis</li><li>Dynamic analysis with breakpoints and register inspection in x64dbg</li></ul>'},
      {h:'Tools Used', c:'<p>IDA Pro &middot; x64dbg &middot; PEStudio &middot; Detect-It-Easy &middot; Sysinternals Process Monitor &middot; CFF Explorer &middot; Python 3 &middot; CyberChef</p>'}
    ]
  }
};


function switchTab(panel,btn){document.querySelectorAll('.cyber-panel').forEach(function(p){p.classList.remove('active');});document.querySelectorAll('.ctab').forEach(function(b){b.classList.remove('active');});document.getElementById('panel-'+panel).classList.add('active');btn.classList.add('active');document.querySelectorAll('#panel-'+panel+' .reveal:not(.visible)').forEach(function(el){setTimeout(function(){el.classList.add('visible');},80);});}
var obsEl=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');obsEl.unobserve(e.target);}});},{threshold:0.07});
document.querySelectorAll('.reveal').forEach(function(el){obsEl.observe(el);});

function openAssessment(key) {
  var a = ASSESSMENTS[key];
  if (!a) return;
  var overlay = document.getElementById('assessModalOverlay');
  var content = document.getElementById('assessModalContent');
  if (!overlay || !content) return;
  var outH = '';
  if (a.outcomes && a.outcomes.length) {
    outH = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:12px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:6px;padding:16px;margin-bottom:20px">'
      + a.outcomes.map(function(o){
          return '<div style="text-align:center">'
            +'<div style="font-size:26px;font-weight:700;color:#c9a84c;line-height:1">'+o.val+'</div>'
            +'<div style="font-size:10px;font-family:monospace;letter-spacing:1px;text-transform:uppercase;color:#777;margin-top:4px">'+o.label+'</div>'
            +'</div>';
        }).join('')
      + '</div>';
  }
  var sectionsH = (a.sections||[]).map(function(s){
    return '<div style="margin-bottom:20px">'
      +'<div style="font-size:11px;font-family:monospace;letter-spacing:2px;text-transform:uppercase;color:#c9a84c;margin-bottom:8px">'+s.h+'</div>'
      +'<div style="font-size:14px;line-height:1.85;color:#ccc">'+s.c+'</div></div>';
  }).join('');
  content.innerHTML =
    '<div style="font-size:11px;font-family:monospace;background:#1e1e2a;color:#6699ff;letter-spacing:2px;text-transform:uppercase;padding:4px 10px;display:inline-block;margin-bottom:6px">'+a.tag+'</div>'
    +'<div style="font-size:12px;font-family:monospace;color:#666;margin-bottom:14px">'+a.label+'</div>'
    +'<div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:20px;line-height:1.2">'+a.title+'</div>'
    + outH + sectionsH;
  overlay.style.display = 'flex';
  content.scrollTop = 0;
}
function closeAssessModal() {
  var o = document.getElementById('assessModalOverlay');
  if (o) o.style.display = 'none';
};
var CASE_STUDIES = {
  vapt: {
    label: 'Penetration Testing · University of Johannesburg · Oct–Nov 2024',
    title: 'Interbank Switching Facility — VA & Risk Mitigation',
    outcomes: [{val:'40%',label:'Critical Vulns Reduced'},{val:'5',label:'High-Severity RCEs'},{val:'3',label:'Systems Assessed'},{val:'100%',label:'Remediation Coverage'}],
    sections: [
      {h:'Background', c:'<p>The client operated an interbank switching facility — infrastructure routing electronic transactions between financial institutions. High-value target handling millions of transactions daily. Engagement required comprehensive vulnerability assessment with minimal operational disruption.</p>'},
      {h:'Scope & Methodology', c:'<p>Assessment covered Apache 2.4.41/Drupal 9.0 web servers, Windows 7/10/11 workstations, internal network, WPA3 WiFi, and Active Directory. Combined automated scanning (Nessus, OpenVAS) with manual penetration testing (Burp Suite, custom scripts).</p>'},
      {h:'Key Findings', c:'<ul><li><strong>Critical — RCE:</strong> Legacy Windows 7 systems exposed to known RCE CVEs with no compensating controls.</li><li><strong>High — Web App Flaws:</strong> SQL injection and stored XSS on Apache/Drupal configuration.</li><li><strong>High — Active Directory:</strong> Excessive privilege assignments and weak password policies enabling lateral movement.</li><li><strong>Medium — Endpoint Gaps:</strong> Anti-malware absent or outdated on legacy systems. No EDR deployed.</li></ul>'},
      {h:'Outcome', c:'<p>Tiered remediation roadmap delivered. Critical vulnerabilities reduced by 40%. Client implemented immediate isolation of legacy systems and initiated OS modernisation. Web vulnerabilities patched within 72 hours of report delivery.</p>'},
      {h:'Tools', c:'<p>Nessus · Burp Suite · Wireshark · Nmap · OpenVAS · PowerShell · Custom VA scripts</p>'}
    ]
  },
  omniverse: {
    label: 'Product Research & Presentation · Lagos, Nigeria · June 2026',
    title: 'Omniverse Africa Summit 2026 — Dual Product Research Submission',
    outcomes: [{val:'2',label:'Products Submitted'},{val:'160',label:'Survey Respondents'},{val:'75%',label:'Purchase Intent'},{val:'$300K',label:'Seed Target (4FG)'}],
    sections: [
      {h:'Context', c:'<p>The Omniverse Research Exchange is a competitive programme at the Omniverse Africa Summit 3.0 in Lagos — one of Africa\'s premier tech conferences. Eric secured a fully funded physical presentation slot for two independent product submissions.</p>'},
      {h:'4FG-Monitor (4First Technologies)', c:'<p>GSM-enabled, weight-based IoT device eliminating LPG gas shortage uncertainty. Real-time cylinder weight monitoring with proactive SMS/app refill alerts.</p><ul><li><strong>Validation:</strong> 160 households surveyed — 120 confirmed purchase intent (75%) at ₦30,000/unit</li><li><strong>Economics:</strong> ~50% gross margin. Break-even ~10,000 units</li><li><strong>TAM:</strong> 9.2M LPG households Nigeria · 60M Africa · 1B globally</li><li><strong>Seed raise:</strong> $300K in progress</li></ul>'},
      {h:'Verix Platform (E World Fortress LTD)', c:'<p>Dual-product trust infrastructure for Nigerian fintechs and SMEs.</p><ul><li><strong>Verix Verify:</strong> API-first identity verification using NIN/BVN/SIM data to produce a TrustScore for KYC/onboarding</li><li><strong>Verix Decide:</strong> Real-time transaction trust-scoring for SMEs via messaging and email integration</li></ul>'},
      {h:'Outcome', c:'<p>Both submissions accepted. Fully funded physical presentation slot secured. One of the first times both a hardware IoT product and cybersecurity SaaS platform have been presented by the same founder at a single summit session.</p>'}
    ]
  },
  insider: {
    label: 'SOC Investigation · Blue Team Lab · QRadar SIEM',
    title: 'QRadar SIEM — Insider Threat Investigation at Financial Company',
    outcomes: [{val:'15',label:'Log Sources'},{val:'6',label:'Attack Stages'},{val:'2',label:'Actors Identified'},{val:'100%',label:'Chain Mapped'}],
    sections: [
      {h:'Scenario', c:'<p>A financial company reported suspicious network activity and potential data exfiltration. Using IBM QRadar SIEM with 15 log sources including firewalls, Suricata IDS/IPS, and Windows Event Logs across the hackdefend.local domain, a full investigation was conducted.</p>'},
      {h:'Attack Chain', c:'<ul><li><strong>Initial Access (T1566):</strong> Malicious important_instructions.docx delivered to user nour</li><li><strong>Attacker IP:</strong> 192.20.80.25 — geolocated and threat-intelligence validated</li><li><strong>Lateral Movement (T1021):</strong> wmiexec.py used across domain. ICMP scan of 192.168.20.0/24</li><li><strong>Persistence (T1547.001):</strong> Registry Run key modified. New account rambo created as backdoor</li><li><strong>Process Injection (T1055):</strong> Code injected into PID 7384 via Sysmon correlation</li><li><strong>Exfiltration (T1041):</strong> sami.xlsx exfiltrated via curl to external C2</li></ul>'},
      {h:'Insider Threat Discovery', c:'<p>Cross-correlating HR access logs, financial records, and communication patterns revealed employee \'sami\' had direct knowledge and financial motive — evidence indicated sami hired the external attacker. Both actors identified and documented.</p>'},
      {h:'Deliverables', c:'<p>Full incident timeline with timestamps · Complete MITRE ATT&CK mapping (6 techniques, 5 tactics) · Evidence package for legal proceedings · Remediation recommendations: MFA enforcement, privileged access review, enhanced DLP, SIEM rule improvements</p>'}
    ]
  }
};


function openCase(key){
  var cs = CASE_STUDIES[key]; if(!cs) return;
  var o  = document.getElementById('caseModalOverlay'); if(!o) return;
  var w  = document.getElementById('caseModalContent'); if(!w) return;

  var outH = (cs.outcomes||[]).length
    ? '<div class="case-outcome-grid">'
      + (cs.outcomes||[]).map(function(o){
          return '<div class="case-outcome"><div class="case-outcome-val">'+o.val+'</div><div class="case-outcome-label">'+o.label+'</div></div>';
        }).join('')
      + '</div>'
    : '';

  var secH = (cs.sections||[]).map(function(s){
    return '<div class="case-modal-section"><h2>'+s.h+'</h2>'+s.c+'</div>';
  }).join('');

  var toolH = (cs.tools||[]).length
    ? '<div style="margin-top:1.5rem;display:flex;flex-wrap:wrap;gap:.35rem">'
      + (cs.tools||[]).map(function(t){ return '<span class="tool-pill">'+t+'</span>'; }).join('')
      + '</div>'
    : '';

  w.innerHTML =
    (cs.tag   ? '<div class="assess-modal-tag">'+cs.tag+'</div>' : '')
    + '<h1 class="assess-modal-title">'+(cs.title||'')+'</h1>'
    + (cs.label ? '<div class="assess-modal-label">'+cs.label+'</div>' : '')
    + outH + secH + toolH;

  o.style.display = 'flex';
  o.classList.add('open');
  w.scrollTop = 0;
}
function closeCaseModal(){var o=document.getElementById('caseModalOverlay');if(o)o.classList.remove('open');document.documentElement.style.overflow='';document.body.style.overflow='';}

// ── CONTACT FORM ─────────────────────────────────────────────────────────────
function initContactForm(){
  var form=document.getElementById('contactForm');
  if(!form)return;
  form.addEventListener('submit',async function(e){
    e.preventDefault();
    var btn=form.querySelector('button[type="submit"]');
    var status=document.getElementById('formStatus');
    if(btn)btn.disabled=true;
    var fd=new FormData(form);
    fd.set('access_key','69e2f1dd-1de4-43c7-b83d-a5e78044cdb4');
    fd.set('subject','New Contact from '+fd.get('name')+' — uzoukwuericikenna.com');
    try{
      var r=await fetch('https://api.web3forms.com/submit',{method:'POST',body:fd});
      var d=await r.json();
      if(d.success){
        if(status){status.textContent='✓ Message sent. I\'ll be in touch.';status.style.color='var(--teal)';}
        form.reset();
        trackEvent('contact_form');
        if(SUPABASE_URL!=='YOUR_SUPABASE_URL'){
          sb('POST','contact_submissions',{name:fd.get('name'),email:fd.get('email'),message:fd.get('message')}).catch(function(){});
        }
      } else {
        if(status){status.textContent='Something went wrong. Try again.';status.style.color='var(--red)';}
      }
    }catch(err){if(status){status.textContent='Connection error. Try again.';status.style.color='var(--red)';}}
    if(btn)btn.disabled=false;
  });
}

// ── LIVE CONTENT FROM SUPABASE ────────────────────────────────────────────────
async function loadLiveContent(){
  if(SUPABASE_URL==='YOUR_SUPABASE_URL')return;
  try{
    var rows=await sb('GET','site_content?select=key,value').catch(function(){return[];});
    var map={};rows.forEach(function(r){map[r.key]=r.value;});
    var fields={hero_bio:'heroBio',about_text:'aboutText',contact_email:'cEmail',contact_location:'cAddr1'};
    Object.entries(fields).forEach(function(kv){var el=document.getElementById(kv[1]);if(el&&map[kv[0]])el.textContent=map[kv[0]];});
  }catch(e){}
}

// ── TESTIMONIALS FROM DB ─────────────────────────────────────────────────────
async function loadTestimonialsFromDB(){
  if(SUPABASE_URL==='YOUR_SUPABASE_URL')return;
  try{
    var items=await sb('GET','testimonials?status=eq.active&order=created_at.desc&select=*');
    if(!items.length)return;
    var grid=document.querySelector('.testimonials-grid');
    if(!grid)return;
    grid.innerHTML=items.map(function(t){
      return'<div class="tcard"><div class="tcard-quote">&#x201C;'+t.quote+'&#x201D;</div>'
        +'<div class="tcard-author"><div class="tcard-name">'+t.author+'</div>'
        +(t.role?'<div class="tcard-role">'+t.role+'</div>':'')+'</div></div>';
    }).join('');
  }catch(e){}
}

// ── SPEAKING FROM DB ──────────────────────────────────────────────────────────
var allSpeakCards = [];
var currentSpeakFilter = 'all';

function renderSpeakCards(cards) {
  var grid = document.querySelector('.speaking-grid');
  if (!grid) return;
  var filtered = currentSpeakFilter === 'all' ? cards :
    cards.filter(function(c){ return (c.status || 'past') === currentSpeakFilter; });
  if (!filtered.length) {
    grid.innerHTML = '<p style="font-family:var(--mono);font-size:.75rem;color:var(--muted);grid-column:1/-1">'
      + (currentSpeakFilter === 'upcoming' ? 'No upcoming events right now.' : 'No past events found.') + '</p>';
    return;
  }
  grid.innerHTML = filtered.map(function(c, idx) {
    var isUpcoming = (c.status || 'past') === 'upcoming';
    var typeClass  = isUpcoming ? 'type-conf' : 'type-training';
    var img = c.cover_image ? '<img class="speak-card-img" src="' + c.cover_image + '" alt="' + c.title + '" loading="lazy"/>' : '';
    return '<div class="speak-card clickable" onclick="openSpeakDB(' + c.id + ')">'
      + img
      + '<div class="speak-card-type ' + typeClass + '">' + c.type + (isUpcoming ? ' &mdash; <span class="badge-upcoming">Upcoming</span>' : '') + '</div>'
      + '<div class="speak-card-title">' + c.title + '</div>'
      + '<div class="speak-card-meta"> ' + (c.date_period || '') + (c.location ? ' &nbsp;&middot;&nbsp;  ' + c.location : '') + (c.organisation ? '<br/> ' + c.organisation + (c.my_role ? ' &nbsp;&middot;&nbsp;  ' + c.my_role : '') : '') + '</div>'
      + (c.short_description ? '<div class="speak-card-desc">' + c.short_description + '</div>' : '')
      + '<div class="speak-card-read-more">Read more &rarr;</div>'
      + '</div>';
  }).join('');
}

function filterSpeaking(filter, btn) {
  currentSpeakFilter = filter;
  document.querySelectorAll('.speak-filter-btn').forEach(function(b){ b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderSpeakCards(allSpeakCards);
}

function openSpeakDB(id) {
  var c = allSpeakCards.find(function(x){ return x.id === id; });
  if (!c) return;
  var o = document.getElementById('speakModalOverlay');
  var content = document.getElementById('speakModalContent');
  if (!o || !content) return;
  var img = c.cover_image ? '<img class="speak-modal-img" src="' + c.cover_image + '" alt="' + c.title + '" style="width:100%;max-width:500px;border-radius:4px;margin-bottom:1.25rem"/>' : '';
  content.innerHTML = img
    + '<div class="speak-modal-type">' + c.type + '</div>'
    + '<div class="speak-modal-title">' + c.title + '</div>'
    + '<div class="speak-modal-meta"> ' + (c.date_period || '') + (c.location ? ' &nbsp;&middot;&nbsp;  ' + c.location : '') + (c.organisation ? '<br/> ' + c.organisation + (c.my_role ? ' &nbsp;&middot;&nbsp;  ' + c.my_role : '') : '') + '</div>'
    + (c.full_description || c.short_description || '');
  o.classList.add('open');
  
}

async function loadSpeakingFromDB() {
  var grid = document.querySelector('.speaking-grid');
  if (!grid) return;
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') return; // keep hardcoded fallback
  try {
    var cards = await sb('GET', 'speaking_cards?order=display_order.asc,date_period.desc&select=*');
    if (!cards.length) return; // keep hardcoded if table empty
    allSpeakCards = cards;
    renderSpeakCards(cards);
    // Show filter tabs
    var filterBar = document.getElementById('speakFilterBar');
    if (filterBar) filterBar.style.display = 'flex';
  } catch(e) {}
}

// ── CASE STUDIES FROM DB// ── CASE STUDIES FROM DB ─────────────────────────────────────────────────────
async function loadCaseStudiesFromDB(){
  if(SUPABASE_URL==='YOUR_SUPABASE_URL')return;
  try{
    var cases=await sb('GET','case_studies?order=display_order.asc&select=*');
    if(!cases.length)return;
    window._dbCases=cases;
    var grid=document.querySelector('#casestudies .case-grid');
    cases.forEach(function(c,i){
      var key='db_'+(c.id||i);
      CASE_STUDIES[key]={tag:c.tag,label:c.label,title:c.title,
        outcomes:Object.keys(c.outcomes||{}).map(function(k){return{val:c.outcomes[k],label:k};}),
        sections:[].concat(c.challenge?[{h:'Challenge',c:'<p>'+c.challenge+'</p>'}]:[],c.full_details?[{h:'Details',c:c.full_details}]:[]),
        tools:c.tech_stack||[]};
      if(grid&&!grid.querySelector('[data-db="'+key+'"]')){
        var d=document.createElement('div');d.className='case-card';d.setAttribute('data-db',key);d.onclick=function(){openCase(key);};
        d.innerHTML='<div class="case-card-num">'+String(grid.children.length+1).padStart(2,'0')+'</div><div class="case-tag-s">'+(c.tag||'')+'</div><div class="case-title">'+(c.title||'')+'</div>'
          +(c.challenge?'<div class="case-challenge-l">Challenge</div><p class="case-body-s">'+c.challenge+'</p>':'')
          +'<div class="case-results">'+(c.results||[]).map(function(x){return'<div class="case-result">'+x+'</div>';}).join('')+'</div>'
          +'<div class="pcard-tools">'+(c.tech_stack||[]).map(function(t){return'<span class="tool-pill">'+t+'</span>';}).join('')+'</div>';
        grid.appendChild(d);
      }
    });
  }catch(e){}
}

// ── CERTIFICATIONS FROM DB ───────────────────────────────────────────────────
async function loadCertificationsFromDB(){
  if(SUPABASE_URL==='YOUR_SUPABASE_URL')return;
  try{
    var certs=await sb('GET','certifications?order=created_at.asc&select=*');
    if(!certs.length)return;
    var lists=document.querySelectorAll('.cert-list');
    if(!lists.length)return;
    var groups={};
    certs.forEach(function(c){var g=c.group||'Other';if(!groups[g])groups[g]=[];groups[g].push(c);});
    var groupNames=Object.keys(groups);
    lists.forEach(function(list,idx){
      var groupKey=groupNames[idx];if(!groupKey)return;
      list.innerHTML=groups[groupKey].map(function(c){
        return'<div class="cert-item"><div class="cert-dot"></div><div><div class="cert-name">'+c.name+(c.credential_url?'<a href="'+c.credential_url+'" target="_blank" style="font-family:var(--mono);font-size:.55rem;color:var(--gold);margin-left:.4rem">View</a>':'')+'</div><div class="cert-issuer">'+(c.issuer||'')+'</div></div><div class="cert-date">'+(c.date_earned||'')+'</div></div>';
      }).join('');
    });
  }catch(e){}
}

// ── QA PRODUCTS FROM DB ───────────────────────────────────────────────────────
async function loadQAProductsFromDB(){
  if(SUPABASE_URL==='YOUR_SUPABASE_URL')return;
  try{
    var products=await sb('GET','qa_products?order=display_order.asc&select=*');
    if(!products.length)return;
    var grid=document.querySelector('.qa-product-grid');
    if(!grid)return;
    grid.innerHTML=products.map(function(p){
      return'<div class="qa-pcard"><div class="qa-sector">'+(p.sector||'Product')+'</div><div class="qa-pname">'+p.name+'</div><div class="qa-pdesc">'+(p.description||'')+'</div></div>';
    }).join('');
  }catch(e){}
}

// ── PM PROJECTS FROM DB ───────────────────────────────────────────────────────
async function loadPMProjectsFromDB(){
  if(SUPABASE_URL==='YOUR_SUPABASE_URL')return;
  try{
    var projects=await sb('GET','pm_projects?order=display_order.asc&select=*');
    if(!projects.length)return;
    var grid=document.querySelector('.pm-cards-grid');
    if(!grid)return;
    grid.innerHTML=projects.map(function(p,idx){
      var num=String(idx+1).padStart(2,'0');
      return'<div class="pm-card"><div class="pm-card-num">'+num+'</div><div class="pm-card-body"><div class="pm-card-name">'+p.name+'</div><div class="pm-card-role">'+(p.role||'')+'</div><div class="pm-card-desc">'+(p.description||'')+'</div></div></div>';
    }).join('');
  }catch(e){}
}

// ── SITE CONTENT FROM DB ─────────────────────────────────────────────────────
async function loadSiteContentFromDB(){
  if(SUPABASE_URL==='YOUR_SUPABASE_URL')return;
  try{
    var rows=await sb('GET','site_content?select=key,value').catch(function(){return[];});
    var map={};rows.forEach(function(r){map[r.key]=r.value;});
    if(map.speaking_sessions){document.querySelectorAll('.media-stat-n').forEach(function(el){var l=el.nextElementSibling;if(l&&(l.textContent.toLowerCase().includes('session')||l.textContent.toLowerCase().includes('training')))el.textContent=map.speaking_sessions;});}
    if(map.speaking_trained){document.querySelectorAll('.media-stat-n').forEach(function(el){var l=el.nextElementSibling;if(l&&(l.textContent.toLowerCase().includes('trained')||l.textContent.toLowerCase().includes('professional')))el.textContent=map.speaking_trained;});}
    if(map.hero_tags){var desc=document.querySelector('.hero-descriptor');if(desc){desc.innerHTML=map.hero_tags.split(',').map(function(t){return'<span>'+t.trim()+'</span>';}).join('');}}
  }catch(e){}
    if(map.skills_data){
      try{
        var skillsData=JSON.parse(map.skills_data);
        var grid=document.querySelector('.skills-grid');
        if(grid&&skillsData.length){
          grid.innerHTML=skillsData.map(function(g){
            return '<div class="skill-group"><div class="skill-group-label">'+g.label+'</div>'
              +'<div class="skill-pills">'+g.skills.map(function(s){
                return '<span class="skill-pill">'+s+'</span>';
              }).join('')+'</div></div>';
          }).join('');
        }
      }catch(e){}
    }
}

// ── HERO STATS ────────────────────────────────────────────────────────────────
function updateHeroStats(){
  if(SUPABASE_URL==='YOUR_SUPABASE_URL')return;
  try{
    sb('GET','site_content?key=in.(hero_stat1_val,hero_stat1_lbl,hero_stat2_val,hero_stat2_lbl,hero_stat3_val,hero_stat3_lbl)&select=key,value').then(function(rows){
      if(!rows||!rows.length)return;
      var m={};rows.forEach(function(r){m[r.key]=r.value;});
      var stats=document.querySelectorAll('.stat');
      if(stats[0]){
        if(m.hero_stat1_val)stats[0].querySelector('.stat-n').textContent=m.hero_stat1_val;
        if(m.hero_stat1_lbl)stats[0].querySelector('.stat-l').textContent=m.hero_stat1_lbl;
      }
      if(stats[1]){
        if(m.hero_stat2_val)stats[1].querySelector('.stat-n').textContent=m.hero_stat2_val;
        if(m.hero_stat2_lbl)stats[1].querySelector('.stat-l').textContent=m.hero_stat2_lbl;
      }
      if(stats[2]){
        if(m.hero_stat3_val)stats[2].querySelector('.stat-n').textContent=m.hero_stat3_val;
        if(m.hero_stat3_lbl)stats[2].querySelector('.stat-l').textContent=m.hero_stat3_lbl;
      }
    }).catch(function(){});
  }catch(e){}
}

// ── SETUP BANNER ──────────────────────────────────────────────────────────────
(function(){
  if(typeof SUPABASE_URL!=='undefined'&&SUPABASE_URL==='YOUR_SUPABASE_URL'){
    var b=document.getElementById('setupBanner');if(b)b.style.display='flex';
  }
})();

// ── NEWSLETTER ────────────────────────────────────────────────────────────────
(function(){
  var form=document.getElementById('nlForm');
  if(!form)return;
  form.addEventListener('submit',async function(e){
    e.preventDefault();
    var email=document.getElementById('nlEmail').value.trim();
    var status=document.getElementById('nlStatus');
    var btn=form.querySelector('.nl-submit');
    if(!email)return;
    btn.textContent='Subscribing...';btn.disabled=true;
    if(SUPABASE_URL!=='YOUR_SUPABASE_URL'){
      try{
        var res=await fetch(SUPABASE_URL+'/rest/v1/newsletter_subscribers',{method:'POST',headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({email:email,subscribed_at:new Date().toISOString()})});
        if(res.ok||res.status===409){
          status.innerHTML='<span style="color:var(--teal);font-family:var(--mono);font-size:.72rem">\u2713 You\'re subscribed. Welcome aboard.</span>';
          document.getElementById('nlEmail').value='';
          btn.textContent='Subscribe \u2192';btn.disabled=false;return;
        }
      }catch(err){}
    }
    try{
      var fd=new FormData();
      fd.append('access_key','69e2f1dd-1de4-43c7-b83d-a5e78044cdb4');
      fd.append('subject','New Subscriber: '+email);
      fd.append('email',email);
      fd.append('message',email+' subscribed via uzoukwuericikenna.com');
      var r=await fetch('https://api.web3forms.com/submit',{method:'POST',body:fd});
      var d=await r.json();
      if(d.success){status.innerHTML='<span style="color:var(--teal);font-family:var(--mono);font-size:.72rem">\u2713 You\'re subscribed. Welcome aboard.</span>';document.getElementById('nlEmail').value='';}
      else{status.innerHTML='<span style="color:var(--red);font-family:var(--mono);font-size:.72rem">Something went wrong. Try again.</span>';}
    }catch(err){status.innerHTML='<span style="color:var(--red);font-family:var(--mono);font-size:.72rem">Connection error. Try again.</span>';}
    btn.textContent='Subscribe \u2192';btn.disabled=false;
  });
})();

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',function(){
  initReveal();
  initNavHighlight();
  initScrollProgress();
  initTracking();
  initContactForm();
  loadPosts();
  loadEvents();
  loadLiveContent();
  loadTestimonialsFromDB();
  loadSpeakingFromDB();
  loadCaseStudiesFromDB();
  loadCertificationsFromDB();
  loadQAProductsFromDB();
  loadPMProjectsFromDB();
  loadSiteContentFromDB();
  updateHeroStats();
});


// ═══════════════════════════════════════════════════════════════════════════
// MAIN SITE FEATURES
// ═══════════════════════════════════════════════════════════════════════════

// ── 1. BLOG PAGINATION ────────────────────────────────────────────────────
var _postsPerPage = 6;
var _currentPage  = 1;

var _origRenderPosts = renderPosts;
renderPosts = function(posts) {
  _allRenderedPosts = posts;
  _currentPage = 1;
  renderPostsPage();
};

var _allRenderedPosts = [];
function renderPostsPage() {
  var grid = document.getElementById('blogGrid');
  if (!grid) return;
  var start = 0;
  var end   = _currentPage * _postsPerPage;
  var slice = _allRenderedPosts.slice(start, end);
  if (!slice.length) {
    grid.innerHTML = '<p class="blog-empty">No posts yet. Check back soon.</p>';
    var moreBtn = document.getElementById('loadMoreBtn');
    if (moreBtn) moreBtn.style.display = 'none';
    return;
  }
  grid.innerHTML = slice.map(function(p) {
    var img = p.cover_image ? '<img class="post-thumb" src="'+p.cover_image+'" alt="'+p.title+'" loading="lazy"/>' : '';
    return '<div class="post-card" onclick="openPost('+p.id+')">'
      + img + '<div class="post-body"><div class="post-meta"><span class="post-cat">'+p.category+'</span><span>'+formatDate(p.published_at)+'</span><span>'+calcReadTime(p.content)+'</span></div>'
      + '<h3 class="post-title">'+p.title+'</h3>'
      + (p.excerpt ? '<p class="post-excerpt">'+p.excerpt+'</p>' : '')
      + '</div></div>';
  }).join('');
  var moreBtn = document.getElementById('loadMoreBtn');
  if (moreBtn) {
    moreBtn.style.display = end < _allRenderedPosts.length ? 'block' : 'none';
    moreBtn.textContent   = 'Load more (' + (_allRenderedPosts.length - end) + ' remaining)';
  }
}

function loadMorePosts() {
  _currentPage++;
  renderPostsPage();
  var grid = document.getElementById('blogGrid');
  if (grid) grid.scrollIntoView({behavior:'smooth', block:'start'});
}

// ── 2. SHARE BUTTONS ON BLOG POSTS ────────────────────────────────────────
function sharePost(title, url) {
  var encoded = encodeURIComponent(url);
  var text    = encodeURIComponent(title + ' — read on uzoukwuericikenna.com');
  return {
    twitter:  'https://twitter.com/intent/tweet?text='+text+'&url='+encoded,
    linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url='+encoded,
    copy:     url
  };
}

function copyPostLink(url) {
  navigator.clipboard.writeText(url).then(function() {
    var btn = document.getElementById('copyLinkBtn');
    if (btn) { btn.textContent = '✓ Copied!'; setTimeout(function(){ btn.textContent = '🔗 Copy link'; }, 2000); }
  }).catch(function() {
    prompt('Copy this link:', url);
  });
}

// Hook into openPost to inject share buttons
var _origOpenPost = openPost;
openPost = async function(id) {
  await _origOpenPost(id);
  var content = document.getElementById('blogModalContent');
  if (!content) return;
  var postUrl = window.location.origin + '/blog/' + id;
  var title = content.querySelector('.blog-modal-title') || {};
  var titleText = (title.textContent || 'Post').trim();
  var shares = sharePost(titleText, postUrl);
  var shareHtml = '<div class="post-share-bar">'
    + '<span class="post-share-label">Share</span>'
    + '<button onclick="nativeShare(titleText, postUrl)" class="share-btn share-native">🔗 Share this post</button>'
    + '</div>'
    + '<div id="sharePanel"></div>'
  if (!content.querySelector('.post-share-bar')) {
    content.insertAdjacentHTML('beforeend', shareHtml);
  }
};

// ── 3. READING PROGRESS BAR ───────────────────────────────────────────────
function initReadingProgress() {
  var bar = document.getElementById('readingProgressBar');
  if (!bar) return;
  var modal = document.getElementById('blogModalOverlay');
  if (!modal) return;
  modal.addEventListener('scroll', function() {
    var scrollTop    = modal.scrollTop;
    var scrollHeight = modal.scrollHeight - modal.clientHeight;
    var progress     = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    bar.style.width  = Math.min(progress, 100) + '%';
    bar.style.opacity = scrollTop > 20 ? '1' : '0';
  });
  // Reset when modal closes
  var closeBtn = modal.querySelector('.blog-modal-close');
  if (closeBtn) {
    var origClose = closeBtn.onclick;
    closeBtn.onclick = function() {
      bar.style.width = '0%';
      if (origClose) origClose();
    };
  }
}

// ── 4. BACK TO TOP BUTTON ─────────────────────────────────────────────────
function initBackToTop() {
  var btn = document.getElementById('backToTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', function() {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, {passive: true});
  btn.addEventListener('click', function() {
    window.scrollTo({top: 0, behavior: 'smooth'});
  });
}

// ── 5. ADD TO GOOGLE CALENDAR ─────────────────────────────────────────────
function addToCalendar(name, dateStr, location, description) {
  var start = dateStr.replace(/-/g,'');
  var end   = start; // single day
  var url = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + '&text=' + encodeURIComponent(name)
    + '&dates=' + start + '/' + end
    + '&location=' + encodeURIComponent(location || '')
    + '&details=' + encodeURIComponent(description || 'Event from uzoukwuericikenna.com');
  window.open(url, '_blank', 'noopener');
}

// ── 6. COOKIE CONSENT ─────────────────────────────────────────────────────
function initCookieConsent() {
  try { if (localStorage.getItem('cookie_consent')) return; } catch(e) {}
  var el = document.getElementById('cookieConsent');
  if (el) setTimeout(function(){ el.style.display = 'flex'; }, 800);
}

function acceptCookies() {
  try { localStorage.setItem('cookie_consent','1'); } catch(e) {}
  var el = document.getElementById('cookieConsent');
  if (el) el.style.display = 'none';
}

function declineCookies() {
  try { localStorage.setItem('cookie_consent','0'); } catch(e) {}
  var el = document.getElementById('cookieConsent');
  if (el) el.style.display = 'none';
}

// ── INIT ALL MAIN SITE FEATURES ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  initReadingProgress();
  initBackToTop();
  initCookieConsent();
});

function nativeShare(title, url) {
  if (navigator.share) {
    navigator.share({title: title, url: url}).catch(function(){});
    return;
  }
  var panel = document.getElementById('sharePanel');
  if (!panel) return;
  var enc = encodeURIComponent(url);
  var txt = encodeURIComponent(title + ' — uzoukwuericikenna.com');
  panel.innerHTML = '<div class="share-panel-box">'
    + '<div class="share-panel-title">Share this post</div>'
    + '<div class="share-panel-btns">'
    + '<a href="https://www.linkedin.com/sharing/share-offsite/?url='+enc+'" target="_blank" rel="noopener" class="share-opt">LinkedIn</a>'
    + '<a href="https://twitter.com/intent/tweet?text='+txt+'&url='+enc+'" target="_blank" rel="noopener" class="share-opt">X (Twitter)</a>'
    + '<a href="https://wa.me/?text='+txt+'%20'+enc+'" target="_blank" rel="noopener" class="share-opt">WhatsApp</a>'
    + '<a href="mailto:?subject='+encodeURIComponent(title)+'&body='+enc+'" class="share-opt">Email</a>'
    + '</div>'
    + '<button onclick="document.getElementById(\'sharePanel\').innerHTML=\'\'" class="share-opt" style="color:var(--muted2)">Close</button>'
    + '</div>';
}

// ── SPEAKING MODAL — self-contained per-card data ────────────────────────────
var _SD = {"0": {"title": "TECHCRUSH Bootcamp Mentorship", "type": "Twitter Space — Mentorship", "date": "16 Dec 2025", "location": "Online (Twitter Space)", "org": "TechCrush HQ", "role": "Mentor & Speaker", "status": "past", "overview": "Mentorship session for absolute beginners and career switchers via Twitter Space (@TechCrushHQ), covering tech career pathways, practical guidance, and real direction on breaking into the industry.", "sections": [{"h": "Session Focus", "c": "Practical mentorship for beginners — how to choose a tech career, what certifications matter, how to land first roles, and how to stand out in the global tech market."}, {"h": "Format", "c": "Live open-mic Twitter Space with Q&A. Open to all experience levels. Hosted by TechCrush HQ."}], "tags": ["Mentorship", "Career Guidance", "Twitter Space", "Virtual"]}, "1": {"title": "Cybersecurity Instruction — United Kingdom", "type": "Training — International", "date": "2023 – Present", "location": "United Kingdom", "org": "UK Partners", "role": "Cybersecurity Instructor", "status": "ongoing", "overview": "Delivered cybersecurity training programmes in the United Kingdom, adapting curriculum and delivery approach to different professional contexts, learning cultures, and regulatory environments.", "tags": ["Threat Analysis", "SOC Operations", "GDPR", "NCSC Guidance", "Cybersecurity"], "sections": [{"h": "UK Engagements", "c": "Training sessions focused on practical threat analysis and SOC operations for IT and security teams. Curriculum adapted to align with UK NCSC guidance and GDPR compliance context."}]}, "2": {"title": "University of Johannesburg — Research Presentations", "type": "Academic Presentation — Researcher", "date": "2024 – 2025", "location": "South Africa", "org": "University of Johannesburg", "role": "Researcher", "status": "past", "overview": "Presented cybersecurity research as part of the Postgraduate Certificate in Cybersecurity at the University of Johannesburg. Academic distinctions across multiple assessments, supervised by Dr. Tevin Moodley.", "tags": ["VAPT", "SIEM", "Digital Forensics", "ISO 27001", "Research", "University of Johannesburg"], "sections": [{"h": "Research Presentations", "c": "<ul><li><strong>VAPT — Interbank Switching Facility:</strong> Full vulnerability assessment and penetration test. CVSS scoring applied. Critical RCE identified. Score: 86%.</li><li><strong>QRadar SIEM Deployment:</strong> Enterprise SIEM deployment and threat detection. 12 custom correlation rules. Score: 84%.</li><li><strong>Digital Forensics Investigation:</strong> End-to-end forensic analysis including disk imaging, artefact recovery, and chain of custody documentation.</li><li><strong>Security Governance:</strong> ISO 27001 framework implementation, risk register, and governance policy drafting.</li></ul>"}, {"h": "Academic Outcome", "c": "Postgraduate Certificate in Cybersecurity awarded. Overall distinction. Supervised by Dr. Tevin Moodley — Certified Ethical Hacker, Digital Forensics Expert, and Cybersecurity Researcher."}]}, "3": {"title": "MMEPE Africa — Choosing a Career in Cybersecurity", "type": "Panel Discussion — Speaker", "date": "5 May 2024", "location": "Online", "org": "MMEPE Africa Community", "role": "Speaker & Panelist", "status": "past", "overview": "Joined MMEPE Africa for an insightful panel discussion on cybersecurity career paths. Covered how to choose a specialisation, what it takes to pursue different tracks, and practical insights into breaking into the cybersecurity industry.", "tags": ["Cybersecurity", "Career Guidance", "Panel Discussion", "MMEPE Africa", "Online"], "sections": [{"h": "Topics Covered", "c": "<ul><li>Overview of cybersecurity career paths and specialisations (SOC Analyst, Penetration Tester, Digital Forensics, GRC)</li><li>Certifications that matter and how to earn them on a budget</li><li>Breaking in without a traditional tech background</li><li>Building practical skills through labs, CTFs, and platforms like TryHackMe</li><li>The Nigerian and African cybersecurity landscape</li></ul>"}, {"h": "Format", "c": "Live panel discussion — free of charge. Hosted by MMEPE Africa Community for aspiring cybersecurity professionals across Africa."}]}, "4": {"title": "StreetHub Academy — Love & Tech Twitter Space", "type": "Twitter Space — Panel Discussion", "date": "14 February 2024", "location": "Online (Twitter Space)", "org": "StreetHub Academy", "role": "Speaker", "status": "past", "overview": "Joined Godwin Kachi and Innocent Unachukwu on a live Twitter Space hosted by StreetHub Academy on Valentine's Day. Open mic format — community conversation about balancing personal life with a demanding tech career.", "tags": ["Twitter Space", "Community", "Career", "StreetHub Academy", "Online"], "sections": [{"h": "Topics Covered", "c": "<ul><li>Balancing love, relationships, and the demands of building in tech</li><li>Career growth strategies for tech professionals in Nigeria</li><li>Opportunities and collaboration in the Imo State tech ecosystem</li><li>Open Q&A — the mic was open to everyone</li></ul>"}, {"h": "Impact", "c": "Live Twitter Space with participants from across Nigeria. Tied to StreetHub's broader mission of building community, not just technical skills."}]}};

function openSpeakCard(idx) {
  var ev = _SD[idx];
  if (!ev) return;
  var overlay = document.getElementById('speakModalOverlay');
  var content = document.getElementById('speakModalContent');
  if (!overlay || !content) return;
  var sc = ev.status==='upcoming'?'#1a7a6a':ev.status==='ongoing'?'#c9a84c':'#555';
  var sl = ev.status==='upcoming'?'Upcoming':ev.status==='ongoing'?'Ongoing':'Past';
  var sectionsH = (ev.sections||[]).map(function(s){
    return '<div style="margin-bottom:1.25rem">'
      +'<div style="font-family:monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c9a84c;margin-bottom:8px">'+s.h+'</div>'
      +'<div style="font-size:14px;line-height:1.8;color:#ccc">'+s.c+'</div></div>';
  }).join('');
  var tagsH = (ev.tags||[]).map(function(t){
    return '<span style="font-size:11px;font-family:monospace;background:#1e1e1e;border:1px solid #333;color:#aaa;padding:2px 8px;border-radius:3px">'+t+'</span>';
  }).join(' ');
  content.innerHTML =
    '<div style="font-size:11px;font-family:monospace;background:#1e2a1e;color:#4caf50;letter-spacing:2px;text-transform:uppercase;padding:4px 10px;display:inline-block;margin-bottom:12px">'+ev.type+'</div>'
    +'<div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:16px;line-height:1.2">'+ev.title+'</div>'
    +'<div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:6px;padding:12px 16px;margin-bottom:20px">'
    +'<div style="font-size:13px;color:#aaa;margin-bottom:6px"> '+ev.date+'</div>'
    +'<div style="font-size:13px;color:#aaa;margin-bottom:6px"> '+ev.location+'</div>'
    +(ev.org?'<div style="font-size:13px;color:#aaa;margin-bottom:6px"> '+ev.org+'</div>':'')
    +(ev.role?'<div style="font-size:13px;color:#aaa;margin-bottom:6px"> '+ev.role+'</div>':'')
    +'<div style="margin-top:8px"><span style="font-size:11px;font-family:monospace;letter-spacing:1px;text-transform:uppercase;background:'+sc+';color:#fff;padding:2px 8px;border-radius:3px">'+sl+'</span></div>'
    +'</div>'
    +(ev.overview?'<div style="font-size:14px;line-height:1.85;color:#ccc;margin-bottom:20px">'+ev.overview+'</div>':'')
    +sectionsH
    +(tagsH?'<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:20px;padding-top:16px;border-top:1px solid #222">'+tagsH+'</div>':'');
  overlay.style.display = 'flex';
  content.scrollTop = 0;
}

function openSpeakEvent(idx) {
  var c = document.querySelector('[data-sidx="'+idx+'"]');
  if (c) openSpeakCard(c);
}

function initNavHighlight(){return;var secs=document.querySelectorAll('section[id]');var links=document.querySelectorAll('.nav-links a[href^="#"]');if(!secs.length||!links.length)return;var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){var id=e.target.id;links.forEach(function(a){a.classList.toggle('active',a.getAttribute('href')==='#'+id);});}});},{rootMargin:'-20% 0px -60% 0px',threshold:0});secs.forEach(function(s){obs.observe(s);});}

function initScrollProgress(){var bar=document.getElementById('scrollProgressBar');if(!bar)return;window.addEventListener('scroll',function(){var s=window.scrollY||document.documentElement.scrollTop;var h=document.documentElement.scrollHeight-window.innerHeight;bar.style.width=(h>0?Math.min(s/h*100,100):0)+'%';},{passive:true});}

(function(){var el=document.getElementById('preloader');if(!el)return;window.addEventListener('load',function(){el.classList.add('done');setTimeout(function(){el.style.display='none';},600);});setTimeout(function(){if(el){el.classList.add('done');setTimeout(function(){el.style.display='none';},600);}},3000);})();

function openEventModal(idx){
  var ev=window._evData&&window._evData[idx];
  if(!ev)return;
  var modal=document.getElementById('eventModalOverlay');
  var content=document.getElementById('eventModalContent');
  if(!modal||!content)return;
  var isPast=ev.status==='past';
  var tags=(ev.tags||[]).map(function(t){return'<span class="tool-pill">'+t+'</span>';}).join('');
  var calBtn='';
  if(!isPast&&ev.date_start){
    calBtn='<button class="cal-add-btn em-cal" onclick="event.stopPropagation();addToCalendBtn(this)" '
      +'data-name="'+ev.name.replace(/"/g,'&quot;')+'" '
      +'data-date="'+ev.date_start+'" '
      +'data-loc="'+(ev.location||'').replace(/"/g,'&quot;')+'" '
      +'data-desc="'+(ev.short_description||'').substring(0,100).replace(/"/g,'&quot;')+'">+ Add to Calendar</button>';
  }
  content.innerHTML=
    '<div class="event-type-badge em-badge">'+ev.type+'</div>'
    +'<h2 class="em-title">'+ev.name+'</h2>'
    +'<div class="em-meta">'
    +'<div class="em-meta-row"><span class="em-icon"></span>'
    +ev.date_start+(ev.date_end&&ev.date_end!==ev.date_start?' &ndash; '+ev.date_end:'')+'</div>'
    +(ev.location?'<div class="em-meta-row"><span class="em-icon"></span>'+ev.location+'</div>':'')
    +(ev.organisation?'<div class="em-meta-row"><span class="em-icon"></span>'+ev.organisation+'</div>':'')
    +'<div class="em-meta-row"><span class="event-status '+(isPast?'status-past':'status-upcoming')+'">'+ev.status+'</span></div>'
    +'</div>'
    +(ev.full_description||ev.short_description
      ?'<div class="em-body">'+(ev.full_description||('<p>'+ev.short_description+'</p>'))+'</div>'
      :'')
    +(tags?'<div class="em-tags">'+tags+'</div>':'')
    +calBtn
    +(isPast?'':'<div id="rsvpBox" style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border2)"><div class="s-eyebrow" style="margin-bottom:.6rem">RSVP</div>'
      +'<div class="form-row"><div class="form-group"><input class="form-input" id="rsvpName" placeholder="Your name"/></div><div class="form-group"><input class="form-input" id="rsvpEmail" type="email" placeholder="your@email.com"/></div></div>'
      +'<button class="form-submit" type="button" onclick="submitRSVP('+idx+')">Reserve my spot &#x2192;</button><div id="rsvpStatus" style="margin-top:.6rem;font-size:.8rem"></div></div>');
  modal.style.display='flex';
  modal.classList.add('open');
  
  content.scrollTop=0;
}

async function submitRSVP(idx){
  var ev=window._evData&&window._evData[idx];var st=document.getElementById('rsvpStatus');
  var n=(document.getElementById('rsvpName')||{}).value||'',e=(document.getElementById('rsvpEmail')||{}).value||'';
  if(!ev||!n.trim()||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)){st.style.color='#e06c6c';st.textContent='Please enter your name and a valid email.';return;}
  st.style.color='var(--gold)';st.textContent='Sending...';
  try{
    var r=await fetch(SUPABASE_URL+'/rest/v1/event_rsvps',{method:'POST',headers:{'Content-Type':'application/json',apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY,Prefer:'return=minimal'},body:JSON.stringify({event_name:ev.name,name:n.trim(),email:e.trim().toLowerCase(),status:'going'})});
    if(r.status===409){st.style.color='var(--teal)';st.textContent='You are already registered for this event.';return;}
    if(!r.ok)throw new Error();
    st.style.color='var(--teal)';st.textContent='\u2713 You are on the list. See you there!';trackEvent('event_rsvp',{event:ev.name});
  }catch(x){st.style.color='#e06c6c';st.textContent='Could not save your RSVP. Please try again.';}
}
function addToCalendBtn(btn){
  addToCalendar(
    btn.getAttribute('data-name'),
    btn.getAttribute('data-date'),
    btn.getAttribute('data-loc'),
    btn.getAttribute('data-desc')
  );
}

function closeEventModal(){
  var modal=document.getElementById('eventModalOverlay');
  if(modal){ modal.classList.remove('open'); modal.style.display='none'; }
}

// ── PCARD CLICK LISTENERS (backup for onclick) ───────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.pcard[onclick]').forEach(function(el) {
    el.style.cursor = 'pointer';
  });
});

function closeCase(){var o=document.getElementById('caseModalOverlay');if(o){o.style.display='none';o.classList.remove('open');}}

// ── GOOGLE TRANSLATE ──────────────────────────────────────────────────────────
function googleTranslateElementInit() {
  new google.translate.TranslateElement({
    pageLanguage: 'en',
    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
    autoDisplay: false
  }, 'google_translate_element');
}

// ── CV GATED DOWNLOAD SYSTEM ──────────────────────────────────────────────────
var _cvRequestType = '';
var CV_TYPES = {
  instructor:  {label:'Cybersecurity Instructor CV', file:'cv-cyber-instructor.docx'},
  soc:         {label:'SOC Analyst CV',               file:'cv-cyber-soc.docx'},
  pentest:     {label:'Penetration Tester CV',        file:'cv-cyber-pentest.docx'},
  consultant:  {label:'Security Consultant CV',       file:'cv-cyber-consultant.docx'},
  qa:          {label:'QA Engineer CV',               file:'cv-qa.docx'},
  pm:          {label:'Product Manager CV',           file:'cv-pm.docx'},
  founder:     {label:'Founder CV',                   file:'cv-founder.docx'},
};
function dlCyberCV(type){ openCVRequest(type); }
function dlCV(type){ openCVRequest(type); }
function openCVRequest(type){
  _cvRequestType = type;
  var ov = document.getElementById('cvRequestOverlay');
  var form = document.getElementById('cvRequestForm');
  var success = document.getElementById('cvRequestSuccess');
  var status = document.getElementById('cvReqStatus');
  if(form) form.style.display='block';
  if(success) success.style.display='none';
  if(status){ status.style.display='none'; status.textContent=''; }
  if(ov) ov.style.display='flex';
}
function closeCVRequest(){
  var ov=document.getElementById('cvRequestOverlay');
  if(ov) ov.style.display='none';
}
async function submitCVRequest(){
  var name   = (document.getElementById('cvReqName')||{}).value||'';
  var org    = (document.getElementById('cvReqOrg')||{}).value||'';
  var email  = (document.getElementById('cvReqEmail')||{}).value||'';
  var reason = (document.getElementById('cvReqReason')||{}).value||'';
  var st     = document.getElementById('cvReqStatus');
  if(!name.trim()||!org.trim()||!email.trim()||!reason.trim()){
    if(st){st.style.display='block';st.style.color='#e06c6c';st.textContent='Please fill in all fields.';}
    return;
  }
  if(!/^[^@]+@[^@]+\.[^@]+$/.test(email)){
    if(st){st.style.display='block';st.style.color='#e06c6c';st.textContent='Please enter a valid email address.';}
    return;
  }
  if(st){st.style.display='block';st.style.color='var(--gold)';st.textContent='Submitting...';}
  var cvInfo = CV_TYPES[_cvRequestType]||{label:_cvRequestType,file:''};
  var refNum = 'CVR-'+(Date.now()+'').slice(-6)+'-'+(Math.random()+'').slice(2,5).toUpperCase();
  try{
    if(typeof SUPABASE_URL!=='undefined'&&SUPABASE_URL!=='YOUR_SUPABASE_URL'){
      var sb = window.sb||function(){return Promise.resolve([]);};
      await fetch(SUPABASE_URL+'/rest/v1/cv_requests',{
        method:'POST',
        headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Prefer':'return=minimal'},
        body:JSON.stringify({cv_type:_cvRequestType,cv_label:cvInfo.label,requester_name:name,organisation:org,email:email,reason:reason,reference:refNum,status:'pending'})
      });
    }
    document.getElementById('cvRefNumber').textContent=refNum;
    try{localStorage.setItem('cv_last',JSON.stringify({ref:refNum,email:email}));}catch(_){}
    document.getElementById('cvRequestForm').style.display='none';
    document.getElementById('cvRequestSuccess').style.display='block';
  }catch(e){
    if(st){st.style.display='block';st.style.color='#e06c6c';st.textContent='Error submitting. Please try again.';}
  }
}


// ── CV STATUS / DOWNLOAD (after admin approval) ──────────────────────────────
async function checkCVStatus(ref,email){
  var out=document.getElementById('cvStatusOut');if(!out)return;
  out.style.color='var(--gold)';out.textContent='Checking...';
  try{
    var r=await fetch('/api/cv-access?ref='+encodeURIComponent(ref)+'&email='+encodeURIComponent(email));
    var d=await r.json();
    if(!r.ok){out.style.color='#e06c6c';out.textContent=d.error||'Not found. Check your reference and email.';return;}
    if(d.status==='approved'){out.style.color='var(--teal)';out.innerHTML='Approved \u2014 <a href="'+d.url+'" style="color:var(--teal);text-decoration:underline">download '+(d.label||'CV')+'</a> (link valid 5 minutes).';}
    else if(d.status==='rejected'||d.status==='declined'){out.style.color='#e06c6c';out.textContent='This request was not approved.';}
    else{out.style.color='var(--gold)';out.textContent='Still pending review. Please check back soon.';}
  }catch(e){out.style.color='#e06c6c';out.textContent='Could not check status right now.';}
}
function initCVStatus(){
  var f=document.getElementById('cvStatusForm');if(!f)return;
  var q=new URLSearchParams(location.search),last={};try{last=JSON.parse(localStorage.getItem('cv_last')||'{}');}catch(_){}
  f.cvRef.value=q.get('ref')||last.ref||'';f.cvEmail.value=q.get('email')||last.email||'';
  f.addEventListener('submit',function(e){e.preventDefault();checkCVStatus(f.cvRef.value.trim(),f.cvEmail.value.trim());});
  if(q.get('ref')&&q.get('email'))checkCVStatus(f.cvRef.value,f.cvEmail.value);
}
document.addEventListener('DOMContentLoaded',initCVStatus);
