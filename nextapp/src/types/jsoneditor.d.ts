declare module 'jsoneditor' {
  export default class JSONEditor {
    constructor(container: HTMLElement, options?: any);
    destroy(): void;
    expandAll(): void;
    collapseAll(): void;
    compact(): void;
    focus(): void;
    get(): any;
    getMode(): string;
    set(json: any): void;
    update(json: any): void;
    setMode(mode: string): void;
    _aceEditor?: any;
    _onSearch?: () => void;
  }
} 