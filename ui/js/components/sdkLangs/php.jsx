import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { useDataStore } from '../../../stores/dataStore';  // Assuming you have a data store context set up

const Php = () => {
    const { sdkConfig } = useDataStore();  // Assuming sdkConfig comes from the dataStore

    let options = {
        lineNumbers: true,
    };

    let code = `$config = [
        "enableLogging" => false,
        "debug" => false,
        "kinesis"  => "${sdkConfig.kinesis}",
        "firehose" => "${sdkConfig.firehose}",
        "s3" => "${sdkConfig.s3}"
    ];`;

    return (
        !code
            ? <div className="theme-spinner-large" />
            : (
                <div>
                    <h1>PHP SDK</h1>
                    <div style={{ width: '1000px' }}>
                        <CodeMirror value={code} options={options} />
                    </div>
                </div>
            )
    );
};

export default Php;
