import React, { useState, useEffect, useContext } from 'react';
import { DataStoreContext } from '../../../stores/dataStore'; // Adjust the path to your dataStore context
import PayloadSearch from '../elements/payloadSearch.jsx';
import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import { useMutation } from '@tanstack/react-query';

const CodeEditor = ({ nodeData, setDirtyState }) => {
    const { nodes, getLambdaSettings, saveLambdaSettings } = useContext(DataStoreContext);
    const [view, setView] = useState(localStorage.getItem('mapper-view.' + nodeData.id) || 'left');
    const [eventId, setEventId] = useState(0);
    const [mapper, setMapper] = useState('default');
    const [payload, setPayload] = useState(nodeData.input ? JSON.stringify(nodeData.input, null, 4) : '');
    const [editable, setEditable] = useState(false);
    const [lambda, setLambda] = useState({});
    const [mappings, setMappings] = useState('');
    const [mock, setMock] = useState('');
    const [mockOpen, setMockOpen] = useState(false);
    const [savedEvents, setSavedEvents] = useState(
        JSON.parse(localStorage.getItem(`savedEvents-${nodeData.id}`) || '[]').filter(event => event)
    );
    const [dirty, setDirty] = useState(false);
    const [preview, setPreview] = useState({});
    const [hasPreviewError, setHasPreviewError] = useState(false);

    const codeMirrorInstances = [];

    // Fetch lambda settings
    useEffect(() => {
        getLambdaSettings(nodeData.id).then((response) => {
            const lambdaSettings = response.lambda.settings[0];
            setLambda(response.lambda || {});
            setMappings(lambdaSettings.mappings || '');
            setMock(response.mock || '');
            initCodeAreas();
        });
    }, [nodeData.id]);

    // CodeMirror initialization
    const initCodeAreas = () => {
        $('.mapping-frame textarea.codeMirror').each((index, textArea) => {
            const textareaName = $(textArea).attr('name');
            if (!codeMirrorInstances[textareaName]) {
                const codeMirrorInstance = CodeMirror.fromTextArea(textArea, {
                    mode: { name: 'javascript' },
                    lineNumbers: true,
                    matchBrackets: true,
                    autoCloseBrackets: true,
                    keyMap: 'sublime',
                    gutters: ['CodeMirror-lint-markers'],
                    lint: { options: { esversion: 6 } }
                });
                codeMirrorInstances[textareaName] = codeMirrorInstance;

                codeMirrorInstance.on('change', () => {
                    if (!dirty) {
                        setDirty(true);
                        setDirtyState({
                            onSave: handleSave,
                            onReset: handleReset,
                        });
                    }
                    clearTimeout(typingTimeout);
                    typingTimeout = setTimeout(() => {
                        codeMirrorInstance.save();
                        runMapping();
                    }, 300);
                });
            }
        });
    };

    const runMapping = () => {
        if (!codeMirrorInstances['mappings']) return;

        const code = codeMirrorInstances['mappings'].doc.getValue();
        try {
            const compiled = mappers[mapper].compile(code);
            const results = mappers[mapper].run(JSON.parse(payload), compiled, 'payload');
            setPreview(results);
        } catch (e) {
            setPreview(e.message || 'error');
            setHasPreviewError(true);
        }
    };

    const handleSave = () => {
        const newLambdaSettings = {
            id: nodeData.id,
            lambda: { ...lambda, settings: [{ mappings: codeMirrorInstances['mappings'].doc.getValue() }] },
            mock: codeMirrorInstances['mock'].doc.getValue() || '{}',
        };

        saveLambdaSettings(newLambdaSettings).then(() => {
            setDirty(false);
            setDirtyState(false);
        });
    };

    const handleReset = () => {
        getLambdaSettings(nodeData.id).then((response) => {
            setLambda(response.lambda || {});
            setMappings(response.lambda.settings[0].mappings || '');
            setMock(response.mock || '');
            initCodeAreas();
            setDirty(false);
        });
    };

    return (
        <div className={`mapping-frame ${mockOpen ? 'mock' : ''}`}>

            <div className="source-panel flex-column">
                <div className="panel-header">
                    <span className="panel-title cursor-pointer" onClick={() => setMockOpen(!mockOpen)}>
                        <i className={!mockOpen ? 'icon-down-open' : 'icon-right-open'} />
                        Source Events
                    </span>
                </div>

                <div style={{ padding: '0 8px 8px' }}>
                    <textarea value={payload} onChange={(e) => setPayload(e.target.value)} className="flex-grow" />
                </div>

                <div className={mockOpen ? 'mock-wrapper flex-grow' : 'display-none'}>
                    <textarea name="mock" className="codeMirror" defaultValue={mock}></textarea>
                </div>
            </div>

            <div className="code-panel">
                <div className="panel-header">
                    <span className="panel-title">Code Editor</span>
                </div>
                <textarea name="mappings" className="codeMirror" defaultValue={mappings} />
                <div className="form-button-bar">
                    <button type="button" className="theme-button" onClick={handleReset} disabled={!dirty}>
                        Discard Changes
                    </button>
                    <button type="button" className="theme-button-primary" onClick={handleSave} disabled={!dirty}>
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="preview-panel">
                <div className="panel-header">
                    <span className="panel-title">Output Preview</span>
                </div>
                <pre className="validationOutput">{JSON.stringify(preview, null, 4)}</pre>
            </div>

        </div>
    );
};

export default CodeEditor;
