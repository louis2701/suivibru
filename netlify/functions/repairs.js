const {getStore,connectLambda}=require('@netlify/blobs');
const seed=require('../../private/seed.json');
const {valid,sameOrigin}=require('./session');
const key='shared-repairflow-data';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const response=(statusCode,body)=>({statusCode,headers,body:JSON.stringify(body)});
exports.handler=async(event)=>{
 try{
  if(!['GET','POST'].includes(event.httpMethod))return response(405,{error:'Méthode non autorisée'});
  if(!valid(event))return response(401,{error:'Connexion requise'});
  if(event.httpMethod==='POST'&&!sameOrigin(event))return response(403,{error:'Origine non autorisée'});
  connectLambda(event);
  const store=getStore('repairflow-sqy');
  let saved=await store.get(key,{type:'json'});
  if(!saved){saved={state:seed,version:0};await store.setJSON(key,saved);}
  if(event.httpMethod==='GET')return response(200,saved);
  if((event.body||'').length>1500000)return response(413,{error:'Sauvegarde trop volumineuse'});
  let payload;try{payload=JSON.parse(event.body||'{}')}catch{return response(400,{error:'JSON invalide'})}
  if(payload.version!==saved.version)return response(409,{error:'Les données ont changé. Rechargez la page avant de modifier.'});
  const state=payload.resetSeed?seed:payload.state;
  if(!state||state.schema!=='repairflow-1'||!Array.isArray(state.rows)||!Array.isArray(state.log)||state.rows.length>10000||state.log.length>5000)return response(400,{error:'Structure invalide'});
  const next={state,version:saved.version+1};await store.setJSON(key,next);return response(200,next);
 }catch(e){console.error('RepairFlow function error',e);return response(500,{error:'Erreur serveur, veuillez réessayer'});}
};
