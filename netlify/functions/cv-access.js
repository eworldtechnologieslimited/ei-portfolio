// GET /api/cv-access?ref=CVR-...&email=...  -> status; if approved, a 5-min signed download URL.
// Needs env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. CV files live in private bucket "cv-files".
const FILES={instructor:'cv-cyber-instructor.docx',soc:'cv-cyber-soc.docx',pentest:'cv-cyber-pentest.docx',consultant:'cv-cyber-consultant.docx',qa:'cv-qa.docx',pm:'cv-pm.docx',founder:'cv-founder.docx'};
const J=(c,b)=>({statusCode:c,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(b)});
exports.handler=async(ev)=>{
  const U=process.env.SUPABASE_URL,K=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!U||!K)return J(500,{error:'Not configured'});
  const q=ev.queryStringParameters||{};const ref=(q.ref||'').trim(),email=(q.email||'').trim().toLowerCase();
  if(!ref||!email)return J(400,{error:'Reference and email required'});
  const h={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};
  const r=await fetch(`${U}/rest/v1/cv_requests?reference=eq.${encodeURIComponent(ref)}&select=id,cv_type,cv_label,email,status`,{headers:h});
  const rows=r.ok?await r.json():[];
  const row=rows[0];
  if(!row||(row.email||'').toLowerCase()!==email)return J(404,{error:'No matching request'});
  if(row.status!=='approved')return J(200,{status:row.status,label:row.cv_label});
  const file=FILES[row.cv_type];if(!file)return J(500,{error:'File not mapped'});
  const s=await fetch(`${U}/storage/v1/object/sign/cv-files/${file}`,{method:'POST',headers:h,body:JSON.stringify({expiresIn:300})});
  if(!s.ok)return J(500,{error:'CV file unavailable'});
  const {signedURL}=await s.json();
  fetch(`${U}/rest/v1/cv_requests?id=eq.${row.id}`,{method:'PATCH',headers:h,body:JSON.stringify({downloaded_at:new Date().toISOString()})}).catch(()=>{});
  return J(200,{status:'approved',label:row.cv_label,url:U+'/storage/v1'+signedURL});
};
