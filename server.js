const env = require("dotenv");
env.config({ path: "./.env" });
const express = require("express");
const Stripe = require("stripe");

const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || "";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";


const app = express();
app.use(express.json())

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

  const numericAmount = parseFloat(amount);

  console.log('original amount', numericAmount);
  console.log('Typeof amount:', typeof numericAmount);
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
      amount: Number(numericAmount) * 100,
      currency: currency,
      payment_method_types: [paymentMethodType],
      description: 'Boundty service',
      receipt_email: receipt_email,
      customer: stripeCustomer.id, // Link payment to customer profile
    });

    const clientSecret = paymentIntent.client_secret;
    const paymentId = paymentIntent.id;

    res.json({
      clientSecret: clientSecret,
      paymentId: paymentId,

    });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
});

app.get("/get-payment-details/:paymentId", async (req, res) => {
  const paymentId = req.params.paymentId;
  try {
    // Retrieve the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    
    // Get the latest charge ID associated with the payment intent
    const latestChargeId = paymentIntent.latest_charge;

      // Retrieve the charge data using the latest charge ID
      const charge = await stripe.charges.retrieve(latestChargeId);

      // Extract the receipt URL from the charge data
      const receiptUrl = charge.receipt_url;

      console.log('receiptUrl:', receiptUrl);

      // Return the receipt URL in the response
      res.json({ receiptUrl: receiptUrl });        

  } catch (e) {
    console.error("Failed to retrieve payment details:", e.message);
    res.status(500).json({ error: "Failed to retrieve payment details" });
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