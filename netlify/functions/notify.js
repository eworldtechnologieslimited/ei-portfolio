// POST /api/notify  {type:'cv_request'|'rsvp'|'cv_approved', ...ids}
// Recipients are decided here, never by the caller. Each row is emailed once (flag columns).
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM, NOTIFY_TO, SITE_URL(optional)
const J=(c,b)=>({statusCode:c,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(b)});
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
exports.handler=async(ev)=>{
  if(ev.httpMethod!=='POST')return J(405,{error:'POST only'});
  const U=process.env.SUPABASE_URL,K=process.env.SUPABASE_SERVICE_ROLE_KEY,R=process.env.RESEND_API_KEY,TO=process.env.NOTIFY_TO;
  const FROM=process.env.RESEND_FROM||'Eric Ikenna <onboarding@resend.dev>';
  const SITE=process.env.SITE_URL||'https://uzoukwuericikenna.com';
  if(!U||!K||!R||!TO)return J(200,{sent:false,reason:'email not configured'});
  let b;try{b=JSON.parse(ev.body||'{}');}catch(e){return J(400,{error:'bad json'});}
  const h={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};
  const get=async p=>{const r=await fetch(U+'/rest/v1/'+p,{headers:h});return r.ok?r.json():[];};
  const patch=(p,o)=>fetch(U+'/rest/v1/'+p,{method:'PATCH',headers:h,body:JSON.stringify(o)});
  const mail=async(to,subject,html)=>{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+R,'Content-Type':'application/json'},body:JSON.stringify({from:FROM,to:[to],subject,html})});return r.ok;};
  const now=new Date().toISOString();
  if(b.type==='cv_request'){
    const row=(await get('cv_requests?reference=eq.'+encodeURIComponent(b.ref||'')+'&notified_at=is.null&select=*'))[0];
    if(!row)return J(200,{sent:false,reason:'unknown or already notified'});
    const ok=await mail(TO,'New CV request: '+row.cv_label,`<p><b>${esc(row.requester_name)}</b> (${esc(row.organisation)}) &lt;${esc(row.email)}&gt; requested <b>${esc(row.cv_label)}</b>.</p><p>${esc(row.reason)}</p><p>Ref ${esc(row.reference)}. Review it in your <a href="${SITE}/admin">admin</a>.</p>`);
    if(ok)await patch('cv_requests?id=eq.'+row.id,{notified_at:now});
    return J(200,{sent:ok});
  }
  if(b.type==='rsvp'){
    const row=(await get('event_rsvps?event_name=eq.'+encodeURIComponent(b.event||'')+'&email=eq.'+encodeURIComponent((b.email||'').toLowerCase())+'&notified_at=is.null&select=*'))[0];
    if(!row)return J(200,{sent:false,reason:'unknown or already notified'});
    const ok=await mail(TO,'New RSVP: '+row.event_name,`<p><b>${esc(row.name)}</b> &lt;${esc(row.email)}&gt; RSVP'd to <b>${esc(row.event_name)}</b>.</p>`);
    await mail(row.email,'You are registered: '+row.event_name,`<p>Hi ${esc(row.name)}, you are registered for <b>${esc(row.event_name)}</b>. See you there!</p><p>Uzoukwu Eric Ikenna<br>${SITE}</p>`);
    if(ok)await patch('event_rsvps?id=eq.'+row.id,{notified_at:now});
    return J(200,{sent:ok});
  }
  if(b.type==='cv_approved'){
    const row=(await get('cv_requests?reference=eq.'+encodeURIComponent(b.ref||'')+'&status=eq.approved&approved_emailed_at=is.null&select=*'))[0];
    if(!row)return J(200,{sent:false,reason:'not approved or already emailed'});
    const link=`${SITE}/cv?ref=${encodeURIComponent(row.reference)}&email=${encodeURIComponent(row.email)}`;
    const ok=await mail(row.email,'Your CV request is approved',`<p>Hi ${esc(row.requester_name)},</p><p>Your request for <b>${esc(row.cv_label)}</b> was approved. <a href="${link}">Download it here</a> (the download link on that page is valid for 5 minutes each time you open it).</p><p>Reference: ${esc(row.reference)}</p><p>Best,<br>Eric</p>`);
    if(ok)await patch('cv_requests?id=eq.'+row.id,{approved_emailed_at:now});
    return J(200,{sent:ok});
  }
  return J(400,{error:'unknown type'});
};
