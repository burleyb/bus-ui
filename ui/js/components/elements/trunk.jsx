import React, { useEffect } from 'react';

const Trunk = (props) => {

    // If you need any logic inside componentDidMount or componentDidUpdate, handle it in useEffect.
    useEffect(() => {
        // This acts like componentDidMount and componentDidUpdate
        // Add any side effects or logic here if needed

        // Cleanup (optional) when component unmounts, like componentWillUnmount
        return () => {
            // Cleanup logic here if necessary
        };
    }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount.

    return <g {...props}></g>;
};

export default Trunk;
