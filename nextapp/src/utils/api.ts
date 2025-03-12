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

// This function has been moved to ApiContext.tsx and exposed as a useSaveQueueSettings hook
// Please use the useSaveQueueSettings hook from @/context/ApiContext instead

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