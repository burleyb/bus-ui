import React, { useState, useEffect, useContext } from 'react';
import CodeMirror from 'codemirror'; // Importing CodeMirror directly
import { DataContext } from '../../../stores/DataContext'; // Assuming DataContext for MobX store
import PayloadSearch from '../elements/payloadSearch.jsx';
import axios from 'axios';
import moment from 'moment';
import _ from 'lodash';

const mappers = {
    default: {
        compile: function () {
            return { exports: {} };
        },
        run: function () {
            return [];
        }
    }
};

const CodeEditor = ({ nodeData }) => {
    const { state } = useContext(DataContext); // Use React Context instead of MobX inject

    const [view, setView] = useState(localStorage.getItem(`mapper-view.${nodeData.id}`) || 'default');
    const [eventName, setEventName] = useState('');
    const [events, setEvents] = useState(false);
    const [eventId, setEventId] = useState(0);
    const [mapper, setMapper] = useState('default');
    const [preview, setPreview] = useState({});
    const [hasPreviewError, setHasPreviewError] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [source, setSource] = useState(false);
    const [payload, setPayload] = useState(nodeData.input ? JSON.stringify(nodeData.input, null, 4) : '');
    const [editable, setEditable] = useState(false);
    const [savedEvents, setSavedEvents] = useState(JSON.parse(localStorage.getItem(`savedEvents-${nodeData.id}`) || '[]').filter(event => event));

    // CodeMirror instances
    const [codeMirrorInstances, setCodeMirrorInstances] = useState({});
    const [typingTimeout, setTypingTimeout] = useState(null);

    useEffect(() => {
        initializeCodeMirror();
        return () => {
            // Clean up on unmount
            for (const instance in codeMirrorInstances) {
                if (codeMirrorInstances[instance]) {
                    codeMirrorInstances[instance].toTextArea();
                    delete codeMirrorInstances[instance];
                }
            }
        };
    }, []);

    const initializeCodeMirror = () => {
        document.querySelectorAll('.mapping-frame textarea.codeMirror').forEach((textArea, index) => {
            const textareaName = textArea.getAttribute('name');
            if (!codeMirrorInstances[textareaName]) {
                const instance = CodeMirror.fromTextArea(textArea, {
                    mode: { name: 'javascript' },
                    lineWrapping: false,
                    lineNumbers: true,
                    indentWithTabs: true,
                    indentUnit: 4,
                    tabSize: 4,
                    matchBrackets: true,
                    autoCloseBrackets: true,
                    gutters: ['CodeMirror-lint-markers'],
                    lint: {
                        options: {
                            esversion: 6
                        }
                    },
                    keyMap: 'sublime'
                });
                instance.on('change', () => handleEditorChange(instance, textareaName));
                setCodeMirrorInstances((prevInstances) => ({
                    ...prevInstances,
                    [textareaName]: instance
                }));
            }
        });
    };

    const handleEditorChange = (instance, textareaName) => {
        if (!dirty) {
            setDirty(true);
        }
        clearTimeout(typingTimeout);
        setTypingTimeout(setTimeout(() => {
            instance.save();
            if (textareaName === 'mappings') {
                runMapping();
            }
        }, 300));
    };

    const runMapping = () => {
        const code = codeMirrorInstances['mappings'].doc.getValue();
        const event = Object.assign({}, events[eventId] || {}, { payload: JSON.parse(payload || '{}') });
        const data = [event];

        try {
            const compiled = mappers[mapper]?.compile(code) || mappers.default.compile(code);
            const result = mappers[mapper]?.run(data, compiled, 'payload') || mappers.default.run(data, compiled, 'payload');
            setPreview(result);
        } catch (error) {
            setPreview(error.message || 'error');
            setHasPreviewError(true);
        }
    };

    const onSave = async () => {
        const data = {
            id: nodeData.id,
            lambda: nodeData.settings?.lambda || {}
        };
        try {
            data.lambda.settings[0].mappings = codeMirrorInstances['mappings'].doc.getValue();
            await axios.post('/api/cron/save', data);
            setDirty(false);
        } catch (error) {
            console.error('Failed to save:', error);
        }
    };

    const onReset = async () => {
        try {
            const response = await axios.get(`/api/cron/${encodeURIComponent(nodeData.id)}`);
            const lambda = response.lambda || {};
            const settings = lambda.settings?.[0] || {};
            setDirty(false);
            codeMirrorInstances['mappings']?.setValue(settings.mappings || '');
        } catch (error) {
            console.error('Failed to reset:', error);
        }
    };

    return (
        <div className={`mapping-frame ${editable ? 'mock' : ''}`}>

            <div className="source-panel flex-column">
                <div className="panel-header">
                    <span className="panel-title">Source Events</span>
                    <span className="pull-right">
                        <img className="theme-white-out" src={`${window.leostaticcdn}images/nodes/queue.png`} style={{ maxWidth: 40 }} alt="Source" />
                        {eventName}
                    </span>
                </div>

                <textarea
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    className="flex-grow"
                />

                <div className="form-button-bar">
                    <button type="button" className="theme-button" onClick={() => onReset()} disabled={!dirty}>Discard Changes</button>
                    <button type="button" className="theme-button-primary" onClick={() => onSave()} disabled={!dirty}>Save Changes</button>
                </div>
            </div>

            <hr />

            <div className="code-panel">
                <div className="panel-header">
                    <span className="panel-title">Code Editor</span>
                </div>
                <textarea name="mappings" className="codeMirror" defaultValue="" />
            </div>

            <hr />

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
