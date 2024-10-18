import React, { useState, useEffect, useContext, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror'; // Assuming CodeMirror is correctly imported
import '@codemirror/lang-javascript';
import '@codemirror/lint';
import '@codemirror/view';
import '@codemirror/fold';

import { useData } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state

const QueueSchema = ({ nodeData }) => {
  const [version, setVersion] = useState('');
  const [defaults, setDefaults] = useState({});
  const [settingsId, setSettingsId] = useState(nodeData?.id || '');
  const editorRef = useRef(null); // Ref to hold the CodeMirror instance
  const textAreaRef = useRef(null); // Ref for the textarea to initialize CodeMirror
  const { nodes, queueInfo } = useData();

  const codeMirrorJSONOptions = {
    mode: { name: 'javascript', json: true },
    lineWrapping: true,
    lineNumbers: true,
    indentWithTabs: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    theme: 'eclipse',
    indentUnit: 4,
    tabSize: 4,
    foldGutter: true,
    gutters: ['CodeMirror-lint-markers', 'CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    lint: { options: { esversion: 6 } },
    foldOptions: {
      widget: (from, to) => {
        const startToken = '{', endToken = '}';
        const internal = editorRef?.current?.getRange(from, to);
        const toParse = startToken + internal + endToken;
        try {
          const parsed = JSON.parse(toParse);
          return `\u21A4${Object.keys(parsed).length}\u21A6`;
        } catch {
          return '\u2194';
        }
      }
    }
  };

  useEffect(() => {
    if (queueInfo && Object.keys(queueInfo).length > 0 && !version) {
      const initialVersion = Object.keys(queueInfo)[0];
      setVersion(initialVersion);
    }
  }, [queueInfo]);

  useEffect(() => {
    if (textAreaRef.current && !editorRef.current) {
      editorRef.current = CodeMirror.fromTextArea(textAreaRef.current, codeMirrorJSONOptions);
      editorRef.current.on('change', () => {
        const updatedValue = editorRef.current.getValue();
        try {
          const parsedValue = JSON.parse(updatedValue);
          setDefaults((prev) => ({ ...prev, [version]: parsedValue }));
        } catch (e) {
          console.log('Invalid JSON', e);
        }
      });
    }
    // Cleanup CodeMirror instance on component unmount
    return () => {
      if (editorRef.current) {
        editorRef.current.toTextArea();
      }
    };
  }, [version]);

  const handleVersionChange = (e) => {
    setVersion(e.target.value);
  };

  if (!nodeData || !settingsId || Object.keys(queueInfo || {}).length === 0) {
    return <div>No schema defined. Register one via LeoRegister (Bus-Register)</div>;
  }

  const versions = Object.keys(queueInfo);

  return (
    <div className="overflow-auto height-1-1">
      <div className="QueueSchema height-1-1">
        <select name="version" title="Version" value={version} onChange={handleVersionChange}>
          {versions.map((value, key) => (
            <option key={key} value={value}>
              {value}
            </option>
          ))}
        </select>
        <div className="height-1-1">
          <textarea
            ref={textAreaRef}
            defaultValue={JSON.stringify(queueInfo[version] || {}, null, 2)}
            style={{ height: '100%' }}
            className="codeMirror"
          />
        </div>
      </div>
    </div>
  );
};

export default QueueSchema;
