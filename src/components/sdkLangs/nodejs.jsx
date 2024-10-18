import React, { useContext } from 'react';
import { useData } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

export default function Nodejs() {
    const state = useData(); 

    // Defining code string and using sdkConfig from state
    const code = `var leo = require("leo-sdk")({
        kinesis: "${state.sdkConfig.kinesis}",
        firehose: "${state.sdkConfig.firehose}",
        s3: "${state.sdkConfig.s3}",
        region: "${state.sdkConfig.region}"
    });`;

    return (
        !code ? (
            <div className="theme-spinner-large" />
        ) : (
            <div>
                <h1>NodeJS SDK</h1>
                <div style={{ width: '1000px' }}>
                    <CodeMirror
                        value={code}
                        extensions={[javascript()]} // Modern way to add language mode
                        height="400px"
                        theme="light" // You can also change this to dark if needed
                        readOnly={true} // Assuming the code is read-only
                    />
                </div>
            </div>
        )
    );
}
