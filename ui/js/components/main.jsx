
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
import EventTrace from './dialogs/eventTrace.jsx';
import Header from './main/header.jsx';
import LeftNav from './main/leftNav.jsx';
import Content from './main/content.jsx';
import MessageCenter from './main/messageCenter.jsx';
import DataSourceConnect from './dialogs/dataSourceConnect.jsx';
import { useDataStore } from '../../../stores/dataStore';  // Using React Context

// String helper function
String.prototype.capitalize = function(lower) {
    return (lower ? this.toLowerCase() : this).replace(/(?:^|\s|\.)\S/g, f => f.toUpperCase());
}

['round', 'floor', 'ceil'].forEach(function(funcName) {
    if (!Math['_' + funcName]) {
        Math['_' + funcName] = Math[funcName];
        Math[funcName] = function(number, precision) {
            precision = precision || 0;
            let factor = Math.pow(10, precision);
            return Math['_' + funcName](number * factor) / factor;
        };
    }
});

const Main = () => {
    const { state, dispatch } = useDataStore();  // Use state and dispatch from context

    return (
        <div>
            <QueryClientProvider client={queryClient}>
                <Header />
                <LeftNav />
                <Content />
                <MessageCenter />
                <DataSourceConnect />
                <EventTrace />
             </QueryClientProvider>   
        </div>
    );
};

export default Main;