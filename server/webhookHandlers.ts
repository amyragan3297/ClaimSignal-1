import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. '
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    const stripe = await getUncachableStripeClient();
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    if (event.type === 'customer.subscription.updated' || 
        event.type === 'customer.subscription.deleted' ||
        event.type === 'customer.subscription.created') {
      const subscription = event.data.object as any;
      await WebhookHandlers.handleSubscriptionChange(
        subscription.id,
        subscription.status,
        subscription.customer
      );
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      if (session.mode === 'subscription' && session.customer && session.subscription) {
        const userId = session.metadata?.userId;
        if (userId) {
          await storage.updateUserStripeInfo(userId, {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            subscriptionStatus: 'active',
          });
          console.log(`User ${userId} subscription activated via checkout webhook`);
        }
      }
    }
  }

  static async handleSubscriptionChange(subscriptionId: string, status: string, customerId: string): Promise<void> {
    console.log(`Subscription ${subscriptionId} changed to ${status} for customer ${customerId}`);
    
    const mappedStatus = ['active', 'trialing'].includes(status) ? 'active' : 'inactive';
    
    const user = await storage.getUserByStripeCustomerId(customerId);
    if (user) {
      await storage.updateUserStripeInfo(user.id, {
        subscriptionStatus: mappedStatus,
        stripeSubscriptionId: subscriptionId,
      });
      console.log(`Updated user ${user.id} subscription status to ${mappedStatus}`);
    }
  }
}
