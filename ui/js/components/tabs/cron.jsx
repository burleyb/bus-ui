import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DataContext } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state
import moment from 'moment';

const Cron = ({ nodeData }) => {
	const { nodes } = useContext(DataContext); // Replacing MobX with DataContext
	const queryClient = useQueryClient(); // TanStack Query's cache management
	const [crons, setCrons] = useState([]);

	// Fetch cron data on mount and refresh it periodically
	useEffect(() => {
		refresh();
		const refreshInterval = setInterval(refresh, 1000); // Refresh every 1 second
		return () => clearInterval(refreshInterval); // Cleanup on unmount
	}, [nodeData.id]);

	const refresh = () => {
		const currentNode = nodes[nodeData.id] || {};
		let cronList = currentNode.crons || [];
		if (typeof cronList === 'object') {
			cronList = [];
		}
		setCrons(cronList);
	};

	// Mutation to handle adding a new cron
	const addCronMutation = useMutation(
		async (newCron) => {
			return axios.post(`${window.api}/system/${nodeData.id}`, newCron);
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries(['nodes', nodeData.id]); // Invalidate the query to refetch nodes
			},
		}
	);

	// Function to add a new cron
	const addCron = () => {
		const newCron = {
			source: null,
			onSave: onSave,
			group: 'cron',
			system: {
				id: nodeData.id,
				label: nodeData.label,
				type: 'cron',
			},
		};
		// Simulate window.createBot or implement as needed
		window.createBot(newCron);
	};

	const onSave = (response) => {
		const updatedCrons = [...crons, response.refId];
		addCronMutation.mutate({ crons: updatedCrons });
		setCrons(updatedCrons);
	};

	// Mutation to handle running a cron now
	const runNowMutation = useMutation(
		async (cronId) => {
			return axios.post(`${window.api}/system/${cronId}`, { executeNow: true });
		},
		{
			onSuccess: () => {
				window.messageLogNotify(`Cron run triggered on ${nodes[cronId]?.label}`);
			},
			onError: (error) => {
				window.messageLogModal(
					`Failure triggering cron run on bot ${nodes[cronId]?.label}`,
					'error',
					error
				);
			},
		}
	);

	// Function to run a cron immediately
	const runNow = (cronId) => {
		runNowMutation.mutate(cronId);
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
												onClick={() => {
													window.subNodeSettings({
														id: cronId,
														label: cron.label,
														type: cron.type,
														server_id: cron.id,
													});
												}}
											>
												{cron.label}
											</a>
										</td>
										<td>{cron.frequency}</td>
										<td>
											{cron.last_run?.end
												? moment(cron.last_run.end).format()
												: ' - '}
										</td>
										<td>{((cron.logs || {}).errors || '').toString()}</td>
										<td className="text-center">
											<button
												type="button"
												className="theme-button"
												onClick={() => runNow(cron.id)}
											>
												Run Now
											</button>
										</td>
									</tr>
								);
							})
						) : (
							<tr>
								<td colSpan="5">No crons available.</td>
							</tr>
						)}
						<tr>
							<td colSpan="5">
								<button
									type="button"
									className="theme-button"
									onClick={addCron}
								>
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
