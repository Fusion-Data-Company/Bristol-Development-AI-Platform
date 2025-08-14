import React from 'react';
import { ExportCompsTools } from './ExportCompsTools';

// Legacy wrapper for backward compatibility
interface ExportToolsProps {
  data: any[];
}

export default function ExportTools({ data }: ExportToolsProps) {
  return <ExportCompsTools data={data} />;
}