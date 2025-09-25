import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface TrackEventRequest {
  event_name: string;
  event_data?: Record<string, unknown>;
  user_id?: string;
  session_id?: string;
  page_url?: string;
  referrer?: string;
  user_agent?: string;
  pixel_data?: {
    facebook_pixel_id?: string;
    google_analytics_id?: string;
    custom_pixels?: Array<{
      name: string;
      id: string;
      code?: string;
    }>;
  };
}

interface EventResponse {
  success: boolean;
  message: string;
  data?: {
    event_id: string;
    tracked_at: string;
  };
  error?: string;
}

// Função para obter IP do cliente
function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])
    : req.socket.remoteAddress;
  return ip || 'unknown';
}

// Função para disparar Facebook Pixel
async function triggerFacebookPixel(pixelId: string, eventName: string, eventData: Record<string, unknown>) {
  try {
    // Em um ambiente real, você usaria a Facebook Conversions API
    // Por enquanto, apenas logamos o evento
    console.log('Facebook Pixel Event:', {
      pixel_id: pixelId,
      event_name: eventName,
      event_data: eventData
    });
    
    // Aqui você implementaria a chamada real para a Facebook Conversions API
    // const response = await fetch('https://graph.facebook.com/v18.0/{pixel-id}/events', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     data: [{
    //       event_name: eventName,
    //       event_time: Math.floor(Date.now() / 1000),
    //       custom_data: eventData
    //     }],
    //     access_token: process.env.FACEBOOK_ACCESS_TOKEN
    //   })
    // });
    
    return true;
  } catch (error) {
    console.error('Facebook Pixel error:', error);
    return false;
  }
}

// Função para disparar Google Analytics
async function triggerGoogleAnalytics(gaId: string, eventName: string, eventData: Record<string, unknown>) {
  try {
    // Em um ambiente real, você usaria a Google Analytics Measurement Protocol
    console.log('Google Analytics Event:', {
      tracking_id: gaId,
      event_name: eventName,
      event_data: eventData
    });
    
    // Aqui você implementaria a chamada real para o Google Analytics
    // const response = await fetch('https://www.google-analytics.com/mp/collect', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     client_id: eventData.client_id || 'anonymous',
    //     events: [{
    //       name: eventName,
    //       params: eventData
    //     }]
    //   })
    // });
    
    return true;
  } catch (error) {
    console.error('Google Analytics error:', error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EventResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido',
      error: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'ID do pixel é obrigatório',
        error: 'MISSING_PIXEL_ID'
      });
    }

    const {
      event_name,
      event_data,
      user_id,
      session_id,
      page_url,
      referrer,
      user_agent,
      pixel_data
    }: TrackEventRequest = req.body;

    // Validar nome do evento
    if (!event_name || typeof event_name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Nome do evento é obrigatório',
        error: 'MISSING_EVENT_NAME'
      });
    }

    // Buscar configuração do pixel/quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, title, settings, user_id')
      .or(`id.eq.${id},public_id.eq.${id}`)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz/Pixel não encontrado',
        error: 'QUIZ_NOT_FOUND'
      });
    }

    const clientIP = getClientIP(req);
    const eventId = uuidv4();
    const trackedAt = new Date().toISOString();

    // Preparar dados do evento
    const eventRecord = {
      id: eventId,
      quiz_id: quiz.id,
      event_name,
      event_data: event_data || {},
      user_id: user_id || null,
      session_id: session_id || null,
      page_url: page_url || req.headers.referer || null,
      referrer: referrer || req.headers.referer || null,
      user_agent: user_agent || req.headers['user-agent'] || null,
      ip_address: clientIP,
      tracked_at: trackedAt
    };

    // Salvar evento no banco
    const { error: saveError } = await supabase
      .from('pixel_events')
      .insert(eventRecord);

    if (saveError) {
      console.error('Error saving pixel event:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao salvar evento',
        error: 'DATABASE_ERROR'
      });
    }

    // Disparar pixels externos se configurados
    const pixelPromises: Promise<boolean>[] = [];

    // Facebook Pixel
    if (pixel_data?.facebook_pixel_id || quiz.settings?.facebook_pixel_id) {
      const pixelId = pixel_data?.facebook_pixel_id || quiz.settings.facebook_pixel_id;
      pixelPromises.push(triggerFacebookPixel(pixelId, event_name, event_data));
    }

    // Google Analytics
    if (pixel_data?.google_analytics_id || quiz.settings?.google_analytics_id) {
      const gaId = pixel_data?.google_analytics_id || quiz.settings.google_analytics_id;
      pixelPromises.push(triggerGoogleAnalytics(gaId, event_name, event_data));
    }

    // Pixels customizados
    if (pixel_data?.custom_pixels || quiz.settings?.custom_pixels) {
      const customPixels = pixel_data?.custom_pixels || quiz.settings.custom_pixels || [];
      customPixels.forEach(pixel => {
        // Implementar lógica para pixels customizados
        console.log('Custom Pixel Event:', {
          name: pixel.name,
          id: pixel.id,
          event_name,
          event_data
        });
      });
    }

    // Aguardar todos os pixels (sem bloquear a resposta)
    if (pixelPromises.length > 0) {
      Promise.all(pixelPromises).catch(error => {
        console.error('Error triggering external pixels:', error);
      });
    }

    // Disparar webhook se configurado
    if (quiz.settings?.webhook_url) {
      try {
        const webhookPayload = {
          event: 'pixel_event',
          quiz_id: quiz.id,
          quiz_title: quiz.title,
          event_name,
          event_data,
          user_id,
          session_id,
          timestamp: trackedAt
        };

        // Fazer requisição para webhook (não aguardar resposta)
        fetch(quiz.settings.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Elevado-Quiz-Webhook/1.0'
          },
          body: JSON.stringify(webhookPayload)
        }).catch(error => {
          console.error('Webhook error:', error);
        });
      } catch (error) {
        console.error('Webhook dispatch error:', error);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Evento rastreado com sucesso',
      data: {
        event_id: eventId,
        tracked_at: trackedAt
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}