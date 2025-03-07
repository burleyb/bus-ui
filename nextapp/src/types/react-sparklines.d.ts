declare module 'react-sparklines' {
  import React from 'react';

  export interface SparklinesProps {
    data: Array<number>;
    limit?: number;
    width?: number;
    height?: number;
    margin?: number;
    min?: number;
    max?: number;
    style?: React.CSSProperties;
    svgWidth?: number;
    svgHeight?: number;
    preserveAspectRatio?: string;
    children?: React.ReactNode;
  }

  export interface SparklinesLineProps {
    color?: string;
    style?: React.CSSProperties;
    onMouseMove?: (event: React.MouseEvent<SVGElement>) => void;
  }

  export interface SparklinesSpotsProps {
    size?: number;
    style?: React.CSSProperties;
    spotColors?: Record<string, string>;
  }

  export class Sparklines extends React.Component<SparklinesProps> {}
  export class SparklinesLine extends React.Component<SparklinesLineProps> {}
  export class SparklinesSpots extends React.Component<SparklinesSpotsProps> {}
} 