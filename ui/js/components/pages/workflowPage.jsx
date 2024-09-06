import React, { useState, useEffect, useContext } from 'react';
import NodeSearch from '../elements/nodeSearch.jsx';
import Tree from '../elements/tree.jsx';
import TimePeriod from '../elements/timePeriod.jsx';
import Dialog from '../dialogs/dialog.jsx';
import Footer from '../main/footer.jsx';
import { DataContext } from '../../../stores/DataContext'; // Assuming usage of React Context for global state

const NodeView = () => {
    const { state, dispatch } = useContext(DataContext); // Using React Context for global state management
    const [viewEvent, setViewEvent] = useState(false);
    const [showSearchBox, setShowSearchBox] = useState(false);
    const [root, setRoot] = useState(null);
    const [dialog, setDialog] = useState(undefined);

    useEffect(() => {
        if (!state.hasData) {
            dispatch({ type: 'FETCH_STATS' });
        }

        // Setup keydown event listener for search box toggle
        const handleKeyDown = (event) => {
            if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA' && document.querySelectorAll('.theme-modal, .theme-dialog').length === 0) {
                if ((65 <= event.keyCode && event.keyCode <= 90 && !event.ctrlKey) || (48 <= event.keyCode && event.keyCode <= 57 && !event.shiftKey)) {
                    setShowSearchBox(true);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        // Fetch data if needed
        if (!state.hasData) {
            dispatch({ type: 'FETCH_STATS' });
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [dispatch, state.hasData]);

    const getData = (rootId) => {
        if (!rootId || !(rootId in state.nodes)) {
            return {};
        }
        return state.nodes[rootId]; // Adjust data logic based on your needs
    };

    const getParents = (nodeId) => {
        const node = state.nodes[nodeId] || {};
        return node.parents || [];  // Adjust according to the actual data structure
    };

    const getKids = (nodeId) => {
        const node = state.nodes[nodeId] || {};
        return node.kids || [];  // Adjust according to the actual data structure
    };

    const onCollapse = (data, expanded) => {
        dispatch({ type: 'CHANGE_COLLAPSED', payload: { data, expanded } });
    };

    const onNodeClick = (data) => {
        window.setDetailsPaneNodes([data.id]);
    };

    const onNodeDblClick = (data, which, me) => {
        me.clickedSide = which.name;
        me.selected = [data.id];
        dispatch({
            type: 'CHANGE_ALL_STATE_VALUES',
            payload: { selected: me.selected, nodeId: data.id }
        });
    };

    const toggleNodeFilter = (type, subtype, event) => {
        event.stopPropagation();
        let show = [...state.show];
        let subtypes = [];
        let newState = {};

        if (!type) {
            show = show.length === 3 ? [] : ['queue', 'bot', 'system'];
            newState = { system: [], bot: [] };
        } else if (!subtype) {
            if (!state[type].length) {
                show = show.length === 3 ? [type] : show.indexOf(type) !== -1 ? show.filter(t => t !== type) : [...show, type];
            }
        } else {
            if (show.length === 3) show = [type];
            else if (!show.includes(type)) show.push(type);

            subtypes = [...state[type]];
            if (subtypes.includes(subtype)) subtypes = subtypes.filter(st => st !== subtype);
            else subtypes.push(subtype);

            if ((type === 'system' && subtypes.length === Object.keys(state.systemTypes).length)) subtypes = [];
        }

        if (!show.length) show = ['queue', 'bot', 'system'];

        newState.show = show;
        dispatch({ type: 'SET_SHOW', payload: newState });
        if (type) {
            newState[type] = subtypes;
            dispatch({ type: 'SET_SUBTYPES', payload: { type, subtypes } });
        }
    };

    const toggleArchived = () => {
        dispatch({ type: 'TOGGLE_ARCHIVED' });
    };

    const toggleSearchBox = (show) => {
        setShowSearchBox(show);
    };

    const renderTree = () => {
        return (
            <Tree
                root={root || state.root}
                source={getData(root || state.root)}
                onCollapse={onCollapse}
                onNodeClick={onNodeClick}
                onNodeDblClick={onNodeDblClick}
                getParents={getParents}
                getKids={getKids}
                treeButtonsRight={state.treeButtonsRight}
                hideLinkBelow={state.hideLinkBelow}
            />
        );
    };

    return (
        <div className="theme-form height-1-1 padding-20 border-box">
            <div className="height-1-1 display-block">
                {state.hasData ? renderTree() : <div className="theme-spinner-large"></div>}
            </div>

            {/* Dialog for sharing links */}
            {dialog === 'ShareLink' && (
                <Dialog title="Share Report" onClose={() => setDialog(undefined)} buttons={{ close: false }}>
                    <textarea
                        className="theme-monospace"
                        style={{ width: '50vw', height: '25vh' }}
                        defaultValue={window.location.href}
                    />
                </Dialog>
            )}

            {/* Footer */}
            {state.showDetails && <Footer settings={state.userSettings} />}
        </div>
    );
};

export default NodeView;
