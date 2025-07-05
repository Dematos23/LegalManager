// This file is a workaround for the missing @types/react-quill package.
// It provides a basic module declaration to satisfy TypeScript.
declare module 'react-quill' {
  import type * as React from 'react';

  interface ReactQuillProps {
    value?: string;
    onChange?: (content: string, delta: any, source: string, editor: any) => void;
    theme?: string;
    modules?: { [key: string]: any };
    [key: string]: any;
  }
  
  const ReactQuill: React.FC<ReactQuillProps>;
  export default ReactQuill;
}
