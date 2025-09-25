import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling } from '@/lib/errorHandling';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20'
});

interface WebhooksAuthApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WebhooksAuthApiResponse>
) {
  const { action } = req.query;

  try {
    switch (action) {
      // Auth Login
      case 'login':
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { email, password } = req.body;
        const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (loginError) throw loginError;

        return res.status(200).json({
          success: true,
          data: authData,
          message: 'Login realizado com sucesso'
        });

      // Auth Signup
      case 'signup':
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        const { email: signupEmail, password: signupPassword, nome } = req.body;
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: signupEmail,
          password: signupPassword,
          options: {
            data: {
              nome
            }
          }
        });

        if (signupError) throw signupError;

        // Create profile
        if (signupData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: signupData.user.id,
              nome,
              email: signupEmail,
              plano: 'free'
            });

          if (profileError) {
            console.error('Erro ao criar perfil:', profileError);
          }
        }

        return res.status(201).json({
          success: true,
          data: signupData,
          message: 'Conta criada com sucesso'
        });

      // Stripe Webhook
      case 'stripe-webhook':
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }

        const sig = req.headers['stripe-signature'] as string;
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!endpointSecret) {
          return res.status(500).json({ success: false, error: 'Webhook secret not configured' });
        }

        let event: Stripe.Event;

        try {
          event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
          console.error('Webhook signature verification failed:', err);
          return res.status(400).json({ success: false, error: 'Invalid signature' });
        }

        // Handle the event
        switch (event.type) {
          case 'customer.subscription.created':
          case 'customer.subscription.updated':
          case 'customer.subscription.deleted':
            const subscription = event.data.object as Stripe.Subscription;
            
            // Update user subscription in database
            const customerId = subscription.customer as string;
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('user_id')
              .eq('stripe_customer_id', customerId)
              .single();

            if (!profileError && profile) {
              const planType = subscription.status === 'active' ? 'premium' : 'free';
              await supabase
                .from('profiles')
                .update({ plano: planType })
                .eq('user_id', profile.user_id);
            }
            break;

          case 'invoice.payment_succeeded':
            const invoice = event.data.object as Stripe.Invoice;
            console.log('Payment succeeded for invoice:', invoice.id);
            break;

          case 'invoice.payment_failed':
            const failedInvoice = event.data.object as Stripe.Invoice;
            console.log('Payment failed for invoice:', failedInvoice.id);
            break;

          default:
            console.log(`Unhandled event type ${event.type}`);
        }

        return res.status(200).json({ success: true, message: 'Webhook processed' });

      // Quiz Completed Webhook
      case 'quiz-completed':
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }

        const { quizId, userId, responses, score } = req.body;

        // Validate webhook signature if needed
        const webhookSecret = process.env.QUIZ_WEBHOOK_SECRET;
        const signature = req.headers['x-webhook-signature'] as string;

        if (webhookSecret && signature) {
          // Implement signature validation logic here
          // For now, we'll skip validation
        }

        // Process quiz completion
        const { error: completionError } = await supabase
          .from('quiz_completions')
          .insert({
            quiz_id: quizId,
            user_id: userId,
            responses,
            score,
            completed_at: new Date().toISOString()
          });

        if (completionError) throw completionError;

        // Trigger any additional processing (analytics, notifications, etc.)
        // This could include sending emails, updating user stats, etc.

        return res.status(200).json({
          success: true,
          message: 'Quiz completion processed successfully'
        });

      // Pixel Event
      case 'pixel-event':
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }

        const { pixelId } = req.query;
        const eventData = req.body;

        // Verify pixel exists and is active
        const { data: pixel, error: pixelError } = await supabase
          .from('pixels')
          .select('*')
          .eq('id', pixelId)
          .eq('ativo', true)
          .single();

        if (pixelError || !pixel) {
          return res.status(404).json({ success: false, error: 'Pixel not found' });
        }

        // Log the event
        const { error: eventError } = await supabase
          .from('pixel_events')
          .insert({
            pixel_id: pixelId,
            event_type: eventData.event_type,
            event_data: eventData,
            user_agent: req.headers['user-agent'],
            ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            created_at: new Date().toISOString()
          });

        if (eventError) throw eventError;

        return res.status(200).json({
          success: true,
          message: 'Event logged successfully'
        });

      default:
        return res.status(400).json({
          success: false,
          error: 'Ação não reconhecida'
        });
    }
  } catch (error) {
    console.error('Erro na API de webhooks/auth:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
}

export default withErrorHandling(handler);