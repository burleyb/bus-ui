import React from 'react';

function getImages(node, dataStore, overwrites) {
  if (!node) return '';

  if (node === 'add') {
    node = { type: 'add' };
  }

  if (node === 'infinite') {
    node = { type: 'infinite' };
  }

  if (typeof node !== 'object') {
    node = dataStore.nodes[node] || {};
  }

  if (overwrites) {
    node = Object.assign({}, node, overwrites);
    if (overwrites.paused && node.status === 'running') {
      node.status = 'paused';
    } else if (!overwrites.paused && node.status === 'paused') {
      node.status = 'running';
    }
  }

  switch (node.type) {
    case 'add':
      return [`${window.leostaticcdn}images/icons/addNode.png`];

    case 'infinite':
      return [`${window.leostaticcdn}images/icons/infinite.png`];

    case 'system':
    case 'queue':
      const icon = node.icon || `${node.type}${node.archived ? '-archived' : ''}.png`;
      return [icon.startsWith('http') ? icon : `${window.leostaticcdn}images/nodes/${icon}`];

    default:
    case 'bot':
      const mainIcon = node.icon || `${node.type || 'bot'}${node.status && node.status !== 'running' ? `-${node.status}` : ''}${node.paused && node.status !== 'paused' ? '-paused' : ''}.png`.replace('-archived-paused', '-archived');
      return [
        mainIcon.startsWith('http') ? mainIcon : `${window.leostaticcdn}images/nodes/${mainIcon}`,
        node.paused ? null : null, // Placeholder for paused icon logic
        null, // Placeholder for template icon logic
      ];
  }
}

export function NodeImages(node, dataStore, overwrites) {
  const images = getImages(node, dataStore, overwrites);

  return `
    <image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${images[0]}" width="100%" height="100%"></image>
    ${images[1] ? `<image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${images[1]}" width="33%" height="33%"></image>` : ''}
    ${images[2] ? `<image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${images[2]}" x="66%" y="66%" width="33%" height="33%"></image>` : ''}
  `;
}

export default class NodeIcon extends React.Component {
  render() {
    const { node, dataStore, className, size, width, height } = this.props;
    const images = getImages(node, dataStore);

    return (
      <svg className={className} width={width || size} height={height || size}>
        <image xmlnsXlink="http://www.w3.org/1999/xlink" xlinkHref={images[0]} width="100%" height="100%" />
        {images[1] && <image xmlnsXlink="http://www.w3.org/1999/xlink" xlinkHref={images[1]} width="33%" height="33%" />}
      </svg>
    );
  }
}
