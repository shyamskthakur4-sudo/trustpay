import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
Deno.serve(async req=>{
 if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
 try{
  const auth=req.headers.get('Authorization'); if(!auth) throw new Error('Authentication required');
  const token=auth.replace('Bearer ','');
  const userDb=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:`Bearer ${token}`}}});
  const {data:{user}}=await userDb.auth.getUser(); if(!user) throw new Error('Invalid session');
  const {data:admin}=await db.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle(); if(!admin) throw new Error('Admin access required');
  const body=await req.json(); if(!body.network||!body.address) throw new Error('Network and address are required');
  const {data,error}=await db.from('wallet_addresses').update({address:String(body.address).trim(),qr_path:body.qrPath??null,updated_at:new Date().toISOString(),updated_by:user.id}).eq('network',body.network).select().single();
  if(error) throw error;
  await db.from('audit_logs').insert({actor_id:user.id,action:'wallet_address_update',entity_type:'wallet_address',entity_id:data.id,metadata:{network:body.network,qrPath:body.qrPath??null}});
  return new Response(JSON.stringify({ok:true,wallet:data}),{headers:{...cors,'Content-Type':'application/json'}});
 }catch(e){return new Response(JSON.stringify({ok:false,error:e instanceof Error?e.message:'Wallet update failed'}),{status:400,headers:{...cors,'Content-Type':'application/json'}})}
});
