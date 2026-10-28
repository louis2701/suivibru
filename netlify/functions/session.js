const crypto=require('node:crypto');
const COOKIE='rf_session';
const secret=()=>process.env.REPAIRFLOW_SESSION_SECRET||'';
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const sign=s=>crypto.createHmac('sha256',secret()).update(s).digest('base64url');
const validSecret=()=>secret().length>=32;
function issue(){const payload=b64({exp:Date.now()+12*3600*1000});return payload+'.'+sign(payload);}
function valid(event){if(!validSecret())return false;const raw=(event.headers.cookie||event.headers.Cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='));if(!raw)return false;
 const token=raw.slice(COOKIE.length+1);const [payload,mac]=token.split('.');if(!payload||!mac)return false;
 const expected=sign(payload);const a=Buffer.from(mac),b=Buffer.from(expected);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return false;
 try{const data=JSON.parse(Buffer.from(payload,'base64url').toString());return Number.isFinite(data.exp)&&data.exp>Date.now();}catch{return false;}}
const cookie=(value,maxAge)=>`${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
const sameOrigin=event=>{const origin=event.headers.origin||event.headers.Origin;if(!origin)return true;const host=event.headers.host||event.headers.Host;try{return new URL(origin).host===host&&new URL(origin).protocol==='https:';}catch{return false;}};
module.exports={issue,valid,cookie,sameOrigin,validSecret};
