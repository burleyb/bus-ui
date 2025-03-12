export async function saveNodeSettings(nodeId: string, settings: any) {
  if (!nodeId) {
    console.error('No nodeId provided for saveNodeSettings');
    return { ok: false, error: 'No node ID provided' };
  }

  const url = '/api/cron/save';
  const payload = { nodeId, ...settings };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to save node settings: ${errorText}`);
      return { ok: false, error: errorText };
    }

    console.log('Node settings saved successfully');
    return { ok: true };
  } catch (error) {
    console.error('Error saving node settings:', error);
    return { ok: false, error: String(error) };
  }
}

export async function saveQueueSettings(queueId: string, settings: any) {
  if (!queueId) {
    console.error('No queueId provided for saveQueueSettings');
    return { ok: false, error: 'No queue ID provided' };
  }

  const url = '/api/queue/save';
  const payload = { queueId, ...settings };

  try {
    console.log(`Saving queue settings for ${queueId}:`, payload);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Try to get the detailed error message
      let errorText;
      try {
        // Try to parse as JSON first
        const errorJson = await response.json();
        errorText = errorJson.message || errorJson.error || JSON.stringify(errorJson);
      } catch (e) {
        // If not JSON, get as text
        errorText = await response.text();
      }
      
      console.error(`Failed to save queue settings for ${queueId}: ${response.status} ${response.statusText}`, errorText);
      return { 
        ok: false, 
        error: errorText,
        status: response.status,
        statusText: response.statusText
      };
    }

    // Try to get the successful response body if available
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // If no JSON response, just create a success object
      data = { success: true };
    }

    console.log('Queue settings saved successfully for', queueId);
    return { ok: true, data };
  } catch (error) {
    console.error('Error saving queue settings:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : String(error),
      originalError: error
    };
  }
}

export interface QueueEvent {
  id: string;
  timestamp: string;
  data: any;
  [key: string]: any;
}

export interface QueueEventsResponse {
  events: QueueEvent[];
  totalCount: number;
  hasMore: boolean;
} 