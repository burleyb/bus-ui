import React, { useState, useEffect, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useData } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state
import moment from 'moment';
import MessageCenter from '../main/messageCenter.jsx'; // Assuming you have a Dialog component

const fetchWebhooks = async (nodeId) => {
  const { data } = await axios.get(`/api/system/${nodeId}/webhooks`);
  return data;
};

const saveWebhooks = async ({ nodeId, webhooks }) => {
  const response = await axios.post(`/api/system/${nodeId}`, { webhooks });
  return response.data;
};

const runWebhook = async (webhookId) => {
  const response = await axios.post(`/api/system/${webhookId}`, { executeNow: true });
  return response.data;
};

function Webhooks({ nodeData }) {
  const state = useData(); 
  const queryClient = useQueryClient();
  const [webhooks, setWebhooks] = useState([]);

  // Fetch webhooks on mount
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['webhooks', nodeData.id],
    queryFn: () => fetchWebhooks(nodeData.id),
    onSuccess: (data) => {
      setWebhooks(data?.webhooks || []);
    },
});

  // Mutation to save webhook settings
  const mutation = useMutation(saveWebhooks, {
    onSuccess: () => {
      queryClient.invalidateQueries(['webhooks', nodeData.id]);
      state.fetchStats();
    },
    onError: (error) => {
      state.messageLogModal(`Failure saving webhooks for ${nodeData.label}`, 'error', error);
    },
  });

  // Mutation to run webhook
  const runWebhookMutation = useMutation(runWebhook, {
    onSuccess: (response, { webhookId }) => {
      MessageCenter.messageLogNotify(`Webhook run triggered on ${state.nodes[webhookId]?.label}`);
    },
    onError: (error, { webhookId }) => {
      MessageCenter.messageLogModal(
        `Failure triggering webhook run on ${state.nodes[webhookId]?.label}`,
        'error',
        error
      );
    },
  });

  // Function to add a new webhook
  const addWebhook = () => {
    MessageCenter.createBot({
      source: null,
      onSave: (response) => {
        setWebhooks((prevWebhooks) => [...prevWebhooks, response.refId]);
        mutation.mutate({ nodeId: nodeData.id, webhooks: [...webhooks, response.refId] });
      },
      group: 'webhook',
      system: {
        id: nodeData.id,
        label: nodeData.label,
        type: 'webhook',
      },
    });
  };

  // Function to run webhook
  const runNow = (webhookId) => {
    runWebhookMutation.mutate({ webhookId });
  };

  useEffect(() => {
    const interval = setInterval(refetch, 1000); // Refresh every 1 second
    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) {
    return <div className="theme-spinner-large"></div>;
  }

  return (
    <div>
      <div className="theme-table-fixed-header">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Frequency</th>
              <th>Last Run</th>
              <th>Last Log</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {webhooks.length > 0 ? (
              webhooks.map((webhookId, index) => {
                const webhook = state.nodes[webhookId] || {};
                return (
                  <tr key={webhookId}>
                    <td>
                      <a
                        onClick={() => {
                          state.subNodeSettings({
                            id: webhookId,
                            label: webhook.label,
                            type: webhook.type,
                            server_id: webhook.id,
                          }, true);
                        }}
                      >
                        {webhook.label}
                      </a>
                    </td>
                    <td>{webhook.frequency}</td>
                    <td>{webhook.last_run?.end ? moment(webhook.last_run.end).format() : ' - '}</td>
                    <td>{(webhook.logs?.errors || '').toString()}</td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="theme-button"
                        onClick={() => runNow(webhook.id)}
                      >
                        Run Now
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="text-center">No Webhooks</td>
              </tr>
            )}
            <tr>
              <td colSpan="5">
                <button type="button" className="theme-button" onClick={addWebhook}>
                  <i className="icon-plus"></i> Add Webhook
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Webhooks;
