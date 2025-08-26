
import React from 'react';

const JsonViewer = ({ data }: { data: any }) => {
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    return null;
  }

  // A recursive function to render JSON object
  const renderObject = (obj: any): (JSX.Element | null)[] => {
    return Object.entries(obj).map(([key, value]) => {
      if (value === null || value === undefined || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)) {
        return null;
      }

      const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);

      return (
        <div key={key}>
          <p className="font-semibold text-muted-foreground">{key}</p>
          <div className="pl-4 border-l-2 mt-1 space-y-1">
            {isObject ? (
              renderObject(value)
            ) : Array.isArray(value) ? (
              <p>{(value as any[]).join(', ')}</p>
            ) : (
              <p>{String(value)}</p>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-4 text-sm mt-2">
      {renderObject(data)}
    </div>
  );
};

export default JsonViewer;
