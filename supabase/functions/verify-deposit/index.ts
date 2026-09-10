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
  const {depositId,status,verifiedAmountUsdt}=await req.json();
  if(!depositId||!['verified','rejected','needs_review'].includes(status)) throw new Error('Invalid verification request');
  const patch:any={status,verified_by:user.id};
  if(status==='verified'){const amount=Number(verifiedAmountUsdt);if(!Number.isFinite(amount)||amount<500) throw new Error('Verified amount must be at least 500 USDT');patch.verified_amount_usdt=amount;patch.verified_at=new Date().toISOString();}
  const {data,error}=await db.from('deposits').update(patch).eq('id',depositId).eq('status','pending').select('id,status,verified_amount_usdt').single();
  if(error) throw error;
  await db.from('audit_logs').insert({actor_id:user.id,action:`deposit_${status}`,entity_type:'deposit',entity_id:depositId,metadata:{verifiedAmountUsdt}});
  return new Response(JSON.stringify({ok:true,deposit:data}),{headers:{...cors,'Content-Type':'application/json'}});
 }catch(e){return new Response(JSON.stringify({ok:false,error:e instanceof Error?e.message:'Verification failed'}),{status:400,headers:{...cors,'Content-Type':'application/json'}})}
});
