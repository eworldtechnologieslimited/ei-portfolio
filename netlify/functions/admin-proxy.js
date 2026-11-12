// POST /api/admin-proxy {u,p,method,path,body,prefer}
// Lets the admin panel read/modify PII tables WITHOUT the public anon key having any access to them.
// Verifies an active admin (verify_admin_login in Postgres), then forwards to PostgREST with the service key.
const TABLES=/^(cv_requests|event_rsvps|contact_submissions|newsletter_subscribers)(\?[^#]*)?$/;
const R=(c,b,t)=>({statusCode:c,headers:{'Content-Type':t||'application/json','Cache-Control':'no-store'},body:b});
exports.handler=async(ev)=>{
  if(ev.httpMethod!=='POST')return R(405,'{"error":"POST only"}');
  const U=process.env.SUPABASE_URL,K=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!U||!K)return R(500,'{"error":"not configured"}');
  let b;try{b=JSON.parse(ev.body||'{}');}catch(e){return R(400,'{"error":"bad json"}');}
  const method=String(b.method||'GET').toUpperCase();
  if(!['GET','POST','PATCH','DELETE'].includes(method)||typeof b.path!=='string'||!TABLES.test(b.path))return R(400,'{"error":"not allowed"}');
  const h={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};
  const v=await fetch(U+'/rest/v1/rpc/verify_admin_login',{method:'POST',headers:h,body:JSON.stringify({p_username:String(b.u||''),p_password:String(b.p||'')})});
  const rows=v.ok?await v.json():[];
  if(!rows.length)return R(401,'{"error":"unauthorised"}');
  const opts={method,headers:Object.assign({},h,b.prefer?{Prefer:String(b.prefer)}:{})};
  if(b.body!=null&&method!=='GET'&&method!=='DELETE')opts.body=JSON.stringify(b.body);
  const r=await fetch(U+'/rest/v1/'+b.path,opts);
  return R(r.status,await r.text());
};
