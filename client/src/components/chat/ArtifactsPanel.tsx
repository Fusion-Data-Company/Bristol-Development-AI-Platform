import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Download, 
  FileText, 
  Code, 
  Image, 
  File,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Maximize2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Artifact {
  id: string;
  title: string;
  type: 'code' | 'document' | 'image' | 'data' | 'chart' | 'other';
  content: string;
  language?: string; // For code artifacts
  filename?: string;
  createdAt: Date;
  messageId?: string;
}

interface ArtifactsPanelProps {
  artifacts: Artifact[];
  onCopy?: (content: string) => void;
  onDownload?: (artifact: Artifact) => void;
  className?: string;
}

const artifactIcons = {
  code: <Code className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  data: <File className="h-4 w-4" />,
  chart: <File className="h-4 w-4" />,
  other: <File className="h-4 w-4" />
};

const artifactColors = {
  code: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  document: 'text-green-400 bg-green-400/10 border-green-400/20',
  image: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  data: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  chart: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  other: 'text-gray-400 bg-gray-400/10 border-gray-400/20'
};

export function ArtifactsPanel({ artifacts, onCopy, onDownload, className }: ArtifactsPanelProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);
  const [expandedArtifacts, setExpandedArtifacts] = useState<Set<string>>(new Set());
  const [fullscreen, setFullscreen] = useState(false);

  // Auto-select first artifact when artifacts change
  useEffect(() => {
    if (artifacts.length > 0 && !selectedArtifact) {
      setSelectedArtifact(artifacts[0].id);
    }
  }, [artifacts, selectedArtifact]);

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      onCopy?.(content);
      // Could add toast notification here
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  const toggleExpanded = (artifactId: string) => {
    const newExpanded = new Set(expandedArtifacts);
    if (newExpanded.has(artifactId)) {
      newExpanded.delete(artifactId);
    } else {
      newExpanded.add(artifactId);
    }
    setExpandedArtifacts(newExpanded);
  };

  const selectedArtifactData = artifacts.find(a => a.id === selectedArtifact);

  if (artifacts.length === 0) {
    return null;
  }

  const ArtifactContent = ({ artifact }: { artifact: Artifact }) => (
    <div className="h-full flex flex-col">
      {/* Artifact Header */}
      <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", artifactColors[artifact.type])}>
              {artifactIcons[artifact.type]}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{artifact.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Badge variant="secondary" className="text-xs">
                  {artifact.type.toUpperCase()}
                </Badge>
                {artifact.language && (
                  <Badge variant="outline" className="text-xs">
                    {artifact.language}
                  </Badge>
                )}
                <span>{artifact.createdAt.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(artifact.content)}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            {onDownload && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDownload(artifact)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFullscreen(!fullscreen)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Artifact Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
            {artifact.type === 'code' ? (
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                <code>{artifact.content}</code>
              </pre>
            ) : artifact.type === 'image' ? (
              <div className="flex justify-center">
                <img 
                  src={artifact.content} 
                  alt={artifact.title}
                  className="max-w-full h-auto rounded-lg shadow-sm"
                />
              </div>
            ) : (
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {artifact.content}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  return (
    <>
      {/* Main Artifacts Panel */}
      <div className={cn(
        "flex flex-col bg-white border-l border-gray-200",
        fullscreen ? "fixed inset-0 z-50" : "h-full",
        className
      )}>
        {/* Panel Header */}
        <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-bristol-cyan" />
              <h2 className="font-semibold text-gray-900">Artifacts</h2>
              <Badge variant="secondary" className="text-xs">
                {artifacts.length}
              </Badge>
            </div>
            {fullscreen && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFullscreen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Artifact List Sidebar */}
          <div className="w-80 border-r border-gray-200 bg-gray-50">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-1">
                {artifacts.map((artifact) => {
                  const isSelected = selectedArtifact === artifact.id;
                  const isExpanded = expandedArtifacts.has(artifact.id);
                  
                  return (
                    <div key={artifact.id}>
                      <button
                        onClick={() => setSelectedArtifact(artifact.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-all duration-200",
                          "hover:bg-white hover:shadow-sm",
                          isSelected 
                            ? "bg-white shadow-sm border border-bristol-cyan/20 ring-1 ring-bristol-cyan/10" 
                            : "bg-transparent"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("p-1.5 rounded-md", artifactColors[artifact.type])}>
                            {artifactIcons[artifact.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm truncate">
                              {artifact.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {artifact.type.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {artifact.createdAt.toLocaleTimeString()}
                              </span>
                            </div>
                            {isExpanded && (
                              <div className="mt-2 text-xs text-gray-600 line-clamp-3">
                                {artifact.content.slice(0, 100)}...
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(artifact.id);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Artifact Content Display */}
          <div className="flex-1 overflow-hidden">
            {selectedArtifactData ? (
              <ArtifactContent artifact={selectedArtifactData} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>Select an artifact to view its content</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Helper function to detect and extract artifacts from AI responses
export function extractArtifacts(content: string, messageId?: string): Artifact[] {
  const artifacts: Artifact[] = [];
  
  // Code block pattern
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let codeMatch;
  let codeIndex = 0;
  
  while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
    const language = codeMatch[1] || 'text';
    const code = codeMatch[2].trim();
    
    if (code) {
      artifacts.push({
        id: `code-${messageId || Date.now()}-${codeIndex}`,
        title: `Code snippet ${language ? `(${language})` : ''}`,
        type: 'code',
        content: code,
        language: language,
        filename: `snippet.${getFileExtension(language)}`,
        createdAt: new Date(),
        messageId
      });
      codeIndex++;
    }
  }

  // Document/text content detection (simple heuristic)
  const lines = content.split('\n');
  let documentContent = '';
  let inDocument = false;
  
  for (const line of lines) {
    // Skip code blocks
    if (line.startsWith('```')) {
      inDocument = false;
      continue;
    }
    
    // Detect structured content
    if (line.match(/^#{1,6}\s/) || line.match(/^\d+\.\s/) || line.match(/^-\s/)) {
      inDocument = true;
      documentContent += line + '\n';
    } else if (inDocument && line.trim()) {
      documentContent += line + '\n';
    } else if (inDocument && !line.trim()) {
      documentContent += '\n';
    }
  }
  
  if (documentContent.trim() && documentContent.length > 100) {
    artifacts.push({
      id: `document-${messageId || Date.now()}`,
      title: 'Generated Document',
      type: 'document',
      content: documentContent.trim(),
      createdAt: new Date(),
      messageId
    });
  }

  return artifacts;
}

function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    'javascript': 'js',
    'typescript': 'ts',
    'python': 'py',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'html': 'html',
    'css': 'css',
    'sql': 'sql',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yml',
    'markdown': 'md',
    'shell': 'sh',
    'bash': 'sh'
  };
  
  return extensions[language.toLowerCase()] || 'txt';
}