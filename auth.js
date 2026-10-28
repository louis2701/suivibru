const crypto=require('node:crypto');
const {issue,cookie,sameOrigin,validSecret}=require('./session');
const json=(code,obj,extra={})=>({statusCode:code,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...extra},body:JSON.stringify(obj)});
exports.handler=async event=>{
 if(!['POST','DELETE'].includes(event.httpMethod))return json(405,{error:'Méthode non autorisée'});
 if(!sameOrigin(event))return json(403,{error:'Origine non autorisée'});
 if(event.httpMethod==='DELETE')return json(200,{ok:true},{'Set-Cookie':cookie('',0)});
 const pass=process.env.REPAIRFLOW_PASSWORD;
 if(!pass||pass.length<12||!validSecret())return json(503,{error:'Configuration du mot de passe manquante sur Netlify'});
 if((event.body||'').length>4096)return json(413,{error:'Requête trop volumineuse'});
 let supplied='';try{supplied=JSON.parse(event.body||'{}').password;}catch{return json(400,{error:'Requête invalide'});}
 if(typeof supplied!=='string')return json(401,{error:'Mot de passe incorrect'});
 const a=crypto.createHash('sha256').update(supplied).digest(),b=crypto.createHash('sha256').update(pass).digest();
 if(!crypto.timingSafeEqual(a,b))return json(401,{error:'Mot de passe incorrect'});
 return json(200,{ok:true},{'Set-Cookie':cookie(issue(),43200)});
};
