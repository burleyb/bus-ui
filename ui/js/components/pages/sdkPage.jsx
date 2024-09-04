import React, { useState } from 'react';
import DropDown from '../elements/dropDown.jsx';
import Nodejs from '../sdkLangs/nodejs.jsx';
import Php from '../sdkLangs/php.jsx';

const SdkPage = () => {
    const [sdkPick, setSdkPick] = useState('node'); // Default language is node, change as needed.

    const renderLang = () => {
        switch (sdkPick) {
            case 'node':
                return <Nodejs />;

            case 'php':
                return <Php />;

            default:
                return null;
        }
    };

    return (
        <div>
            <DropDown onChange={(value) => setSdkPick(value)} /> {/* Assuming DropDown allows you to select sdk */}
            {renderLang()}
        </div>
    );
};

export default SdkPage;
