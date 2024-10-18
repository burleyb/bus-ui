import React, { useContext } from 'react';
import { useData } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state
import CodeMirror from '@uiw/react-codemirror';
import { php } from '@codemirror/lang-php'; // Uncomment this if the PHP language module is available

export default function Php() {
    const state = useData(); 

    const code = `$config = [
        "enableLogging" => false,
        "debug" => false,
        "kinesis"  => "${state.sdkConfig.kinesis}",
        "firehose" => "${state.sdkConfig.firehose}",
        "s3" => "${state.sdkConfig.s3}"
    ];`;

    return (
        !code ? (
            <div className="theme-spinner-large" />
        ) : (
            <div>
                <h1>PHP SDK</h1>
                <div style={{ width: '1000px' }}>
                    <CodeMirror
                        value={code}
                        extensions={[php()]} // Ensure you import the php extension from CodeMirror if available
                        height="400px"
                        theme="light"
                        readOnly={true} // Assuming it's read-only
                    />
                </div>
            </div>
        )
    );
}
