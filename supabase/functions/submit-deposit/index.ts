import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
Deno.serve(async req=>{
 if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
 try{
  const {userId,network,amountUsdt,txHash}=await req.json();
  const amount=Number(amountUsdt);
  if(!userId||!network||!txHash||!Number.isFinite(amount)||amount<500) throw new Error('Minimum deposit is 500 USDT');
  const {data:wallet}=await db.from('wallet_addresses').select('address,active').eq('network',network).single();
  if(!wallet?.active) throw new Error('Network is unavailable');
  const {data,error}=await db.from('deposits').insert({user_id:userId,network,amount_usdt:amount,tx_hash:String(txHash).trim(),status:'pending'}).select('id,status').single();
  if(error?.code==='23505') throw new Error('This transaction hash has already been submitted');
  if(error) throw error;
  return new Response(JSON.stringify({ok:true,deposit:data}),{headers:{...cors,'Content-Type':'application/json'}});
 }catch(e){return new Response(JSON.stringify({ok:false,error:e instanceof Error?e.message:'Request failed'}),{status:400,headers:{...cors,'Content-Type':'application/json'}})}
});
