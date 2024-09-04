import React, { useState, useEffect } from 'react';
import NodeSearch from '../elements/nodeSearch.jsx';
import Tree from '../elements/tree.jsx';
import TimePeriod from '../elements/timePeriod.jsx';
import Dialog from '../dialogs/dialog.jsx';
import Footer from '../main/footer.jsx';
import { useDataStore } from '../../../stores/dataStore'; // Import from the correct location

const NodeView = (props) => {
    const { dataStore, getStats, setupURL, changeDetailsBool, changeCollapsed, changeAllStateValues } = useDataStore(); // Use dataStore functions from the context
    const [viewEvent, setViewEvent] = useState(false);
    const [showSearchBox, setShowSearchBox] = useState(false);
    const [source, setSource] = useState({});
    const [root, setRoot] = useState(null);
    const [force, setForce] = useState(false);
    const [dialog, setDialog] = useState(undefined);

    useEffect(() => {
        setupURL();
        if (!dataStore.hasData) {
            getStats();
        }
        window.dataStore = { ...dataStore };
        window.keepTrackRight = {};
        window.keepTrackLeft = {};
        window.collapsedStart = [];
    }, [dataStore, setupURL, getStats]);

    useEffect(() => {
        window.nodeTree.updateDiagram = (newRoot, force) => {
            setRoot(newRoot || root);
            setForce(force);
        };
    }, [root]);

    const getData = (rootId) => {
        if (!rootId || !(rootId in dataStore.nodes)) {
            return {};
        }

        const basicNode = (node) => {
            if (!node) return false;

            let icon = node.icon || `${node.type}${['paused', 'archived', 'danger', 'blocked', 'rogue'].includes(node.status) ? '-' + node.status : ''}.png`;
            return {
                id: node.id,
                type: node.type,
                system: node.system,
                label: node.label,
                server_id: node.id,
                icon,
                status: node.status,
                above: node.display.above,
                below: node.display.below,
                details: node.details || {},
                message: node.message,
                logs: node.logs,
                kids: [],
                parents: [],
                archived: node.archived,
                paused: node.paused
            };
        };

        const getParents = (n, foundNodeList = { [n.id]: 1 }, level = 0) => {
            const parents = [];
            for (let id in n.link_to.parent) {
                const parent = basicNode(dataStore.nodes[id]);
                if (parent && parent.status !== 'archived' && !parent.archived) {
                    parent.relation = n.link_to.parent[id].display;
                    parent.parents = !foundNodeList[id] ? getParents(dataStore.nodes[id], { ...foundNodeList }, ++level) : [{
                        id: 'infinite',
                        icon: window.leostaticcdn + 'images/icons/infinite.png',
                        type: 'infinite',
                        kids: [n],
                        relation: { line: 'dashed_gray' }
                    }];
                    parent.leftCollapsed = level >= 1 && parent.parents.length > 1;
                    parents.push(parent);
                }
            }
            return parents.sort((a, b) => a.label.localeCompare(b.label));
        };

        const getKids = (n, foundNodeList = { [n.id]: 1 }, level = 0) => {
            const kids = [];
            for (let id in n.link_to.children) {
                const child = basicNode(dataStore.nodes[id]);
                if (child && child.status !== 'archived' && !child.archived) {
                    child.relation = n.link_to.children[id].display;
                    child.kids = !foundNodeList[id] ? getKids(dataStore.nodes[id], { ...foundNodeList }, ++level) : [{
                        id: 'infinite',
                        icon: window.leostaticcdn + 'images/icons/infinite.png',
                        type: 'infinite',
                        parents: [n],
                        relation: { line: 'dashed_gray' }
                    }];
                    child.rightCollapsed = level >= 1 && child.kids.length > 1;
                    kids.push(child);
                }
            }
            return kids.sort((a, b) => a.label.localeCompare(b.label));
        };

        const node = basicNode(dataStore.nodes[rootId]);
        node.parents = getParents(dataStore.nodes[rootId]);
        node.kids = getKids(dataStore.nodes[rootId]);
        return node;
    };

    const toggleStat = () => {
        // Assuming settings change logic is part of the dataStore
        dataStore.toggleStats();
    };

    const toggleDetails = () => {
        changeDetailsBool(!dataStore.details);
    };

    const toggleSearchBox = (show) => {
        setShowSearchBox(show);
        if (show) {
            document.querySelector('.searchBox').focus();
        }
    };

    const nodeSearch = (
        <div className="theme-icon-group pull-left control">
            {showSearchBox ? (
                <NodeSearch settings={'true'} toggleSearchBox={() => toggleSearchBox(false)} className="black left-icon" placeholder="Search..." />
            ) : (
                <div className="theme-autocomplete black left-icon">
                    <input type="search" className="searchBox theme-form-input" placeholder="Search..." onClick={() => toggleSearchBox(true)} />
                    <i className="search-icon icon-search" />
                </div>
            )}
        </div>
    );

    const treeButtons = [
        <div key={0} className="theme-icon-group control pill">
            <i className={`icon-hourglass${dataStore.stats ? ' active' : ''}`} title="all stats" onClick={toggleStat}></i>
        </div>,
        <div key={1} className="theme-icon-group control pill" title="Save this workflow">
            <i className="icon-bookmark" onClick={dataStore.saveWorkflow}></i>
        </div>,
        <div key={2} className="theme-icon-group control pill" title="View Share Link">
            <i className="icon-share" onClick={() => setDialog('ShareLink')}></i>
        </div>,
        dataStore.details ? (
            <div key={3} className="theme-icon-group show-charts" onClick={toggleDetails}>
                <i className="icon-chart" title="show charts" /> Show Charts
            </div>
        ) : false
    ];

    const treeButtonsRight = (
        <div className="theme-icon-group push-right">
            <TimePeriod
                className="control"
                defaults={dataStore.urlObj.timePeriod}
                intervals={['minute_15', 'hour', 'hour_6', 'day']}
                onChange={dataStore.dateRangeChanged}
                singleField="true"
                spread="false"
                pauseButton="true"
            />
            <div className="theme-icon-group control">
                <i className="icon-plus" onClick={dataStore.createNode}></i>
            </div>
        </div>
    );

    return (
        <div className={`node-view ${dataStore.details ? 'show-details-pane ' : ''} ${props.className}`}>
            {dataStore.hasData ? (
                <Tree
                    id="mainTree"
                    settings={dataStore.settings}
                    root={dataStore.node}
                    force={force}
                    source={getData(root)}
                    hideLinkBelow={!dataStore.stats}
                    nodeSearch={nodeSearch}
                    treeButtons={treeButtons}
                    treeButtonsRight={treeButtonsRight}
                    onCollapse={(data, expanded) => changeCollapsed(data, expanded)}
                    onNodeClick={(data) => {
                        changeAllStateValues([data.id], dataStore.urlObj.timePeriod, dataStore.view, [0, 0], data.id);
                    }}
                    onNodeDblClick={(data, which, me) => {
                        me.clickedSide = which.name;
                        changeAllStateValues([data.id], dataStore.urlObj.timePeriod, dataStore.view, [0, 0], data.id);
                    }}
                />
            ) : (
                <div className="theme-spinner-large"></div>
            )}

            {dialog === 'ShareLink' && (
                <Dialog title="Share Report" onClose={() => setDialog(undefined)} buttons={{ close: false }}>
                    <textarea className="theme-monospace" style={{ width: '50vw', height: '25vh' }} defaultValue={window.location.href}></textarea>
                </Dialog>
            )}

            {dataStore.details && <Footer settings={dataStore.settings} />}
        </div>
    );
};

export default NodeView;
