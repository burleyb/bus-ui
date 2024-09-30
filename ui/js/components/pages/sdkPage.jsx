import React, { useContext } from 'react';
import DropDown from '../elements/dropDown.jsx';
import Nodejs from '../sdkLangs/nodejs.jsx';
import Php from '../sdkLangs/php.jsx';
import { DataContext } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state

const SdkPage = () => {
    const { state } = useContext(DataContext); // Using React Context for state management

    const renderLang = () => {
        switch (state.sdkPick) {
            case 'node':
                return <Nodejs />;
            case 'php':
                return <Php />;
            default:
                return false;
        }
    };

    return (
        <div>
            <DropDown />
            {renderLang()}
        </div>
    );
};

export default SdkPage;
