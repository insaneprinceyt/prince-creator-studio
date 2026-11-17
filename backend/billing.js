// Optional Stripe checkout foundation. Disabled unless STRIPE_SECRET_KEY and PRICE IDs are configured.
// No card details are handled by this application.
import Stripe from 'stripe';
export function attachBilling(app,{authenticate}){
  const secret=process.env.STRIPE_SECRET_KEY;
  if(!secret){app.get('/api/billing/status',(_req,res)=>res.json({enabled:false}));return;}
  const stripe=new Stripe(secret);
  app.get('/api/billing/status',(_req,res)=>res.json({enabled:true,provider:'Stripe'}));
  app.post('/api/billing/checkout',authenticate,async(req,res,next)=>{
    try{
      const plan=req.body?.plan;
      if(!['Starter','Pro','Elite'].includes(plan))return res.status(400).json({error:'Invalid plan'});
      const price=process.env['STRIPE_PRICE_'+plan.toUpperCase()];
      if(!price)return res.status(503).json({error:'Plan not configured'});
      const session=await stripe.checkout.sessions.create({
        mode:'subscription',line_items:[{price,quantity:1}],
        success_url:process.env.BILLING_SUCCESS_URL,
        cancel_url:process.env.BILLING_CANCEL_URL,
        client_reference_id:req.user.uid,
        metadata:{plan}
      });
      res.json({url:session.url});
    }catch(next){}
  });
  // Webhook verification and subscription entitlements must be implemented before enabling provisioning on payment.
}
