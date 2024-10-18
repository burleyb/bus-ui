import React, { useContext } from 'react';
import DetailsPane from './detailsPane.jsx';
import { useData } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state

function Footer() {
    const state = useData(); 

    return (
        <footer className="details-pane">
            {state?.userSettings?.details ? <DetailsPane /> : false}
        </footer>
    );
}

export default Footer;
