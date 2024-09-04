import React from 'react';
import DetailsPane from './detailsPane.jsx';

const Footer = ({ userSettings }) => {
    return (
        <footer className="details-pane">
            {userSettings.details ? <DetailsPane /> : null}
        </footer>
    );
};

export default Footer;
