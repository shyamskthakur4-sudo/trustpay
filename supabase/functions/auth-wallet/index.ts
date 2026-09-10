import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
Deno.serve(async req=>{
 if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
 try{
  const {verifierHash,action}=await req.json();
  if(typeof verifierHash!=='string'||!/^[a-f0-9]{64}$/.test(verifierHash)) throw new Error('Invalid wallet verifier');
  if(action==='create'){
   const {data,error}=await db.from('wallet_accounts').insert({verifier_hash:verifierHash}).select('id').single();
   if(error?.code==='23505') return new Response(JSON.stringify({ok:false,error:'Wallet already exists'}),{status:409,headers:{...cors,'Content-Type':'application/json'}});
   if(error) throw error; return new Response(JSON.stringify({ok:true,walletId:data.id}),{headers:{...cors,'Content-Type':'application/json'}});
  }
  if(action==='restore'){
   const {data,error}=await db.from('wallet_accounts').select('id,locked_at').eq('verifier_hash',verifierHash).maybeSingle();
   if(error) throw error; if(!data||data.locked_at) return new Response(JSON.stringify({ok:false,error:'Wallet not found or locked'}),{status:401,headers:{...cors,'Content-Type':'application/json'}});
   return new Response(JSON.stringify({ok:true,walletId:data.id}),{headers:{...cors,'Content-Type':'application/json'}});
  }
  throw new Error('Unsupported action');
 }catch(e){return new Response(JSON.stringify({ok:false,error:e instanceof Error?e.message:'Request failed'}),{status:400,headers:{...cors,'Content-Type':'application/json'}})}
});
