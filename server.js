// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('sk_test_51Jcqv9Gz9tfzSM8yRHgPIAPHPOT8y2iULtbHf0BayOEe9gM3TKGKfqCxeIiqaB9NFP5IG729eiqbKg0Z51HHMRxb00yokObx9p');

const paymentIntent = await stripe.paymentIntents.create({
  amount: 1099,
  currency: 'usd',
  payment_method_types: ['card'],
});
const clientSecret = paymentIntent.client_secret
// Pass the client secret to the client