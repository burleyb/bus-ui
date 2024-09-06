import React, { useContext } from 'react';
import DetailsPane from './detailsPane.jsx';
import { DataContext } from '../../../stores/DataContext'; // Assuming React Context for global state

function Footer() {
    const { state } = useContext(DataContext); // Access global state using Context

    return (
        <footer className="details-pane">
            {state.userSettings.details ? <DetailsPane /> : false}
        </footer>
    );
}

export default Footer;
