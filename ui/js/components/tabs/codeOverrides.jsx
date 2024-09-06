import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import JSONPretty from 'react-json-pretty';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { DataContext } from '../../../stores/DataContext'; // Correct DataContext import

const StyledMainDiv = styled.div`
	height: 75%;
`;

const StyledFormattedDiv = styled.div`
	float: right;
	width: 32%;
	padding: 5px;
`;

const StyledTextareaDiv = styled.div`
	float: right;
	width: 32%;
	height: 100%;
	padding: 5px;
`;

const StyledTextarea = styled.textarea`
	width: 100%;
	height: 100%;
`;

function CodeOverrides({ nodeData, data }) {
	// Accessing the global context using the useContext hook for DataContext
	const { cronInfo } = useContext(DataContext);
	const queryClient = useQueryClient(); // For invalidating the query after save

	// Retrieve settings from props or fallback to default values
	const settings = nodeData || data || {};
	const [code, setCode] = useState(
		cronInfo?.code ||
			`if (typeof obj === 'object') {
    // make a change to see results
    obj.modified = true;
}`
	);

	const [dirty, setDirty] = useState(false);
	const [payload, setPayload] = useState(`{
    "id": "example event",
    "event": "dw.load",
    "payload": {
        "type": "dimension",
        "entity": "d_example",
        "data": {
            "id": 1234567890,
            "example_id": 1234567890,
            "other_info": "none"
        }
    },
    "event_source_timestamp": 1556662750662,
    "eid": "z/2019/04/30/22/20/1556662805215-0000000",
    "correlation_id": {
        "source": "example.event",
        "start": "z/2019/04/30/22/20/1556662802206-0000001",
        "units": 1
    },
    "timestamp": 1556662805344
}`);
	const [results, setResults] = useState('Results will show here');

	// Save the original state for reset purposes
	const originalState = {
		code,
		payload,
		results,
		dirty: false,
	};

	// Function to handle code changes and process overrides
	const handleCodeChanges = (event) => {
		const updatedCode = event.target.value;
		setCode(updatedCode);
		processOverrides(payload, updatedCode);
	};

	// Function to handle payload changes and process overrides
	const handlePayloadChanges = (event) => {
		const updatedPayload = event.target.value;
		setPayload(updatedPayload);
		processOverrides(updatedPayload, code);
	};

	// Save the changes using axios and invalidate the query
	const handleSave = async () => {
		try {
			await axios.post(`${window.api}/cron/save`, {
				id: settings.id,
				label: settings.label,
				code,
			});
			window.messageLogNotify(`Bot settings saved successfully for ${settings.label}`);
			setDirty(false);
			queryClient.invalidateQueries(['cronInfo']); // Invalidate the cached query to refetch the updated data
		} catch (error) {
			window.messageLogModal(`Error saving bot ${settings.label}`, 'error', error);
		}
	};

	// Reset to the original state
	const handleReset = () => {
		setCode(originalState.code);
		setPayload(originalState.payload);
		setResults(originalState.results);
		setDirty(originalState.dirty);
	};

	// Process the payload and code to produce results
	const processOverrides = (obj, code) => {
		try {
			obj = JSON.parse(obj);
		} catch (e) {
			return setResults(`Payload is invalid JSON. ${e.message}`);
		}

		try {
			const func = new Function(`return (obj) => {${code}; return obj;}`)();
			func(obj);
		} catch (e) {
			return setResults(`Invalid JavaScript syntax. ${e.message}`);
		}

		setResults(obj);
		setDirty(true);
	};

	// Render the component
	if (!cronInfo?.lambda?.settings[0]?.codeOverrides) {
		return <div>Code editing unavailable.</div>;
	}

	return (
		<StyledMainDiv>
			<StyledFormattedDiv>
				<h3>Payload results</h3>
				<JSONPretty id="payloadResults" data={results} />
			</StyledFormattedDiv>

			<StyledTextareaDiv>
				<h3>Insert JavaScript to modify the payload. Use "obj" for the entire object coming in.</h3>
				<StyledTextarea value={code} onChange={handleCodeChanges} />
			</StyledTextareaDiv>

			<StyledTextareaDiv>
				<h3>Paste a payload below</h3>
				<StyledTextarea value={payload} onChange={handlePayloadChanges} />
			</StyledTextareaDiv>

			<div className="form-button-bar mobile-hide">
				<button type="button" className="theme-button" onClick={handleReset} disabled={!dirty}>
					Reset
				</button>
				<button type="button" className="theme-button-primary" onClick={handleSave} disabled={!dirty}>
					Save Changes
				</button>
			</div>
		</StyledMainDiv>
	);
}

export default CodeOverrides;
