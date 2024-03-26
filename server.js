const env = require("dotenv");
env.config({ path: "./.env" });
const express = require("express");
const Stripe = require("stripe");

const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || "";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";


const app = express();
app.use(express.json())



// Webhook route
app.post('/stripe-webhook', require('body-parser').raw({ type: '*/*' }),  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, 'whsec_LNaXRcnbkkAj3PionM4eT9piqXtaY93V');
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.sendStatus(400); // Bad request
    }

    // Handle the 'charge.succeeded' event specifically
    if (event.type === 'charge.succeeded') {
        const charge = event.data.object;
        const receipt_url = charge.receipt_url;

        if (receipt_url) {
console.log('receipt_url': receipt_url);
        } else {
            console.error('No receipt_url found in the webhook event');
        }
    } 

    res.sendStatus(200); // Successful response
});




//Confirm the API version from your stripe dashboard
const stripe = Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

app.get("/get-publishable-key", async(req, res) => {
  if(stripePublishableKey.length){
    res.statusCode = (200)
    res.json({publishableKeyFromServer: stripePublishableKey})
  }
  else{
    res.statusCode = (503)
    res.json({error: "Publishable key not available!"})
  }
})

app.post("/create-payment-intent", async (req, res) => {
  const { paymentMethodType, currency, amount, receipt_email, customer } = req.body;
  try {
    let stripeCustomer;

    // Search for existing customers in Stripe by email
    const existingCustomers = await stripe.customers.list({ email: customer.email });
    if (existingCustomers.data.length > 0) {
      // Customer already exists, use the first customer found
      stripeCustomer = existingCustomers.data[0];
    } else {
      // Create customer profile in Stripe
      stripeCustomer = await stripe.customers.create({
        name: customer.name,
        email: customer.email,
      });
    }

    // Create payment intent with customer ID
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(amount) * 100,
      currency: currency,
      payment_method_types: [paymentMethodType],
      description: 'Boundty payment',
      receipt_email: receipt_email,
      customer: stripeCustomer.id, // Link payment to customer profile
    });

    const clientSecret = paymentIntent.client_secret;

    res.json({
      clientSecret: clientSecret,

    });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
});

app.all(/.*/, (req, res) => {
  res.statusCode = (404)
  res.send('Invalid Endpoint.')
})


const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
    console.log(`Server is listening at port number : ${PORT}`);
})