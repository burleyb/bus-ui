import React, { useState, useEffect, useContext } from 'react';
import { DataStoreContext } from '../../../stores/dataStore'; // Adjust the path to your data store context
import { useQuery, useMutation } from '@tanstack/react-query';
import moment from 'moment';

const Cron = ({ nodeData }) => {
  const { nodes, fetchCronData, createCron, triggerCronRun, saveCronData } = useContext(DataStoreContext);
  const [crons, setCrons] = useState([]);

  const { data: cronData, refetch } = useQuery(['cronData', nodeData.id], () => fetchCronData(nodeData.id), {
    onSuccess: (data) => {
      setCrons(data.crons || []);
    }
  });

  const mutation = useMutation((data) => saveCronData(nodeData.id, data), {
    onSuccess: () => {
      refetch();
    }
  });

  useEffect(() => {
    const refreshTimeout = setInterval(() => {
      refetch();
    }, 1000);

    return () => {
      clearInterval(refreshTimeout);
    };
  }, [refetch]);

  const handleAddCron = () => {
    createCron({
      source: null,
      onSave: (response) => handleSaveCron(response),
      group: 'cron',
      system: {
        id: nodeData.id,
        label: nodeData.label,
        type: 'cron'
      }
    });
  };

  const handleSaveCron = (response) => {
    const updatedCrons = [...crons, response.refId];
    mutation.mutate({ crons: updatedCrons });
  };

  const handleRunNow = (cronId) => {
    triggerCronRun(cronId)
      .then(() => {
        alert('Cron run triggered');
      })
      .catch((error) => {
        alert('Error triggering cron run: ' + error.message);
      });
  };

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
            {crons.length ? (
              crons.map((cronId) => {
                const cron = nodes[cronId] || {};
                return (
                  <tr key={cronId}>
                    <td>
                      <a
                        onClick={() =>
                          window.subNodeSettings({
                            id: cronId,
                            label: cron.label,
                            type: cron.type,
                            server_id: cron.id
                          })
                        }
                      >
                        {cron.label}
                      </a>
                    </td>
                    <td>{cron.frequency}</td>
                    <td>{cron.last_run && cron.last_run.end ? moment(cron.last_run.end).format() : ' - '}</td>
                    <td>{(cron.logs?.errors || '').toString()}</td>
                    <td className="text-center">
                      <button type="button" className="theme-button" onClick={() => handleRunNow(cron.id)}>
                        Run Now
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5">No crons available</td>
              </tr>
            )}
            <tr>
              <td colSpan="5">
                <button type="button" className="theme-button" onClick={handleAddCron}>
                  <i className="icon-plus"></i> Add Cron
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Cron;
