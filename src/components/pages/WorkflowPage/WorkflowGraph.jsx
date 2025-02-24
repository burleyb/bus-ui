import React, { useEffect } from 'react';

import { useData } from '../../../stores/DataContext';
import Tree from '../../elements/tree.jsx';

export default function WorkflowGraph({ data }) {
  const { selectedNodeId, setSelectedNodeId, zoomLevel, isLoading } = useData();

    // useEffect(() => {
    //     if (isLoading || !data) return;

    //     const graphConfig = {
    //         bindto: ".workflow-graph",
    //         nodeHighlightBehavior: true,
    //         node: {
    //             color: 'lightblue',
    //             highlightStrokeColor: 'blue',
    //             fontSize: 12,
    //         },
    //         link: {
    //             highlightColor: 'lightblue',
    //         },
    //         d3: {
    //             gravity: -400,
    //             linkLength: 100,
    //         },
    //         data: { 
    //             ...data.data,
    //             onclick: (nodeId) => setSelectedNodeId(nodeId)
    //         },
    //         zoomable: true,
    //         height: window.innerHeight - 200,
    //         width: window.innerWidth - 400,
    //     };


    //     try {
    //         // const container = c3.generate(graphConfig);

    //       } catch (error) {
    //         console.error('Error rendering graph:', error);
    //       }
    // }, [data, isLoading, setSelectedNodeId]);
      
    if (isLoading) {
        return <div className="flex-1 flex items-center justify-center">Loading...</div>;
    }

    return (
        <div style={{ width: '100%', height: '600px' }}>
        <Tree
            root={'workflow-graph'}
            source={data}
            zoomLevel={zoomLevel}
            onNodeClick={(nodeId) => setSelectedNodeId(nodeId)}
            onNodeDblClick={(nodeId) => setSelectedNodeId(nodeId)}
            hideLinkBelow={true}
            treeButtonsRight={true}
            getParents={(nodeId) => data.parents[nodeId]}
            getKids={(nodeId) => data.kids[nodeId]}
            onCollapse={(nodeId, collapsed, expanded) => console.log(nodeId, collapsed, expanded)}
            collapsed={data.collapsed}
            expanded={data.expanded}
        />
        </div>
    ); 
}
