import React from 'react';
import { TransactionGraph } from './TransactionGraph';

/**
 * GraphViewer.jsx
 * Wrapper / alias for TransactionGraph ensuring single render and no auto-scroll.
 */
export const GraphViewer = (props) => {
  return <TransactionGraph {...props} />;
};

export default GraphViewer;
