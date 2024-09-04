import React, { useState, useEffect } from 'react';
import dataStore from '../../../stores/dataStore.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import moment from 'moment';

const fetchWebhooks = async (nodeId) => {
  // Fetch webhooks data from the server
  const response = await axios.get(`/system/${nodeId}/webhooks`);
  return response.data;
};

const updateWebhooks = async ({ nodeId, webhooks }) => {
  // Update the webhooks list on the server
  const response = await axios.post(`/system/${nodeId}`, { webhooks });
  return response.data;
};

const triggerWebhook = async (webhookId) => {
  // Trigger webhook run
  const response = await axios.post(`/system/${webhookId}`, { executeNow: true });
  return response.data;
};

const Webhooks = ({ nodeData }) => {
  const [webhooks, setWebhooks] = useState([]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(['webhooks', nodeData.id], () => fetchWebhooks(nodeData.id), {
    onSuccess: (data) => {
      setWebhooks(data.webhooks || []);
    },
  });

  const updateMutation = useMutation(updateWebhooks, {
    onSuccess: () => {
      queryClient.invalidateQueries(['webhooks', nodeData.id]);
    },
  });

  const triggerMutation = useMutation(triggerWebhook, {
    onSuccess: () => {
      window.messageLogNotify('Webhook run triggered successfully');
    },
    onError: () => {
      window.messageLogModal('Failure triggering webhook run', 'error');
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries(['webhooks', nodeData.id]);
    }, 1000);

    return () => clearInterval(interval);
  }, [queryClient, nodeData.id]);

  const addWebhook = () => {
    window.createBot({
      source: null,
      onSave: (response) => {
        const updatedWebhooks = [...webhooks, response.refId];
        setWebhooks(updatedWebhooks);
        updateMutation.mutate({ nodeId: nodeData.id, webhooks: updatedWebhooks });
      },
      group: 'webhook',
      system: {
        id: nodeData.id,
        label: nodeData.label,
        type: 'webhook',
      },
    });
  };

  const runNow = (webhookId) => {
    triggerMutation.mutate(webhookId);
  };

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
            {webhooks.length ? (
              webhooks.map((webhookId, index) => {
                const webhook = dataStore.nodes[webhookId] || {};
                return (
                  <tr key={webhookId}>
                    <td>
                      <a
                        onClick={() => {
                          window.subNodeSettings(
                            {
                              id: webhookId,
                              label: webhook.label,
                              type: webhook.type,
                              server_id: webhook.id,
                            },
                            true
                          );
                        }}
                      >
                        {webhook.label}
                      </a>
                    </td>
                    <td>{webhook.frequency}</td>
                    <td>{webhook.last_run && webhook.last_run.end ? moment(webhook.last_run.end).format() : ' - '}</td>
                    <td>{((webhook.logs || {}).errors || '').toString()}</td>
                    <td className="text-center">
                      <button type="button" className="theme-button" onClick={() => runNow(webhook.id)}>
                        Run Now
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  No webhooks available.
                </td>
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
};

export default Webhooks;
