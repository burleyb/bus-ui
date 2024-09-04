import React, { useState, useEffect, useContext } from 'react';
import { DataStoreContext } from '../../../stores/dataStore'; // Adjust path to your dataStore context
import JSONPretty from 'react-json-pretty';
import styled from 'styled-components';
import { useMutation } from '@tanstack/react-query';

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

const CodeOverrides = ({ nodeData }) => {
    const { cronInfo, saveCronInfo } = useContext(DataStoreContext);
    
    const [code, setCode] = useState(`if (typeof obj === 'object') {
        obj.modified = true;
    }`);
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
    const [dirty, setDirty] = useState(false);

    const originalState = {
        code: code,
        payload: payload,
        results: results,
        dirty: false
    };

    const mutation = useMutation((data) => saveCronInfo(data), {
        onSuccess: () => {
            setDirty(false);
        },
        onError: (error) => {
            alert(`Error saving bot: ${error.message}`);
        }
    });

    const handleCodeChanges = (event) => {
        const newCode = event.target.value;
        setCode(newCode);
        processOverrides(payload, newCode);
    };

    const handlePayloadChanges = (event) => {
        const newPayload = event.target.value;
        setPayload(newPayload);
        processOverrides(newPayload, code);
    };

    const handleSave = () => {
        mutation.mutate({ id: nodeData.id, code });
    };

    const handleReset = () => {
        setCode(originalState.code);
        setPayload(originalState.payload);
        setResults(originalState.results);
        setDirty(false);
    };

    const processOverrides = (obj, code) => {
        try {
            obj = JSON.parse(obj);
        } catch (e) {
            return setResults(`Payload is invalid JSON. ${e.message}`);
        }

        try {
            let func = new Function(`return (obj) => {${code}; return obj;}`)();
            func(obj);
            setResults(obj);
        } catch (e) {
            return setResults(`Invalid JavaScript syntax. ${e.message}`);
        }

        setDirty(true);
    };

    if (!cronInfo?.lambda?.settings?.[0]?.codeOverrides) {
        return <div>Code editing unavailable.</div>;
    }

    return (
        <StyledMainDiv>
            <StyledFormattedDiv>
                <h3>Payload Results</h3>
                <JSONPretty id="payloadResults" data={results}></JSONPretty>
            </StyledFormattedDiv>

            <StyledTextareaDiv>
                <h3>Insert JavaScript to modify payload. Use "obj" for the entire object coming in.</h3>
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
};

export default CodeOverrides;
