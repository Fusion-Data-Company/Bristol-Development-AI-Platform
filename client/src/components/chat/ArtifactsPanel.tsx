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
  modelUsed?: string; // Track which AI model generated this artifact
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
  code: 'text-bristol-cyan bg-bristol-cyan/10 border-bristol-cyan/30',
  document: 'text-bristol-gold bg-bristol-gold/10 border-bristol-gold/30',
  image: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  data: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  chart: 'text-bristol-cyan bg-bristol-cyan/10 border-bristol-cyan/30',
  other: 'text-bristol-gold bg-bristol-gold/10 border-bristol-gold/30'
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
      <div className="flex-shrink-0 border-b border-bristol-gold/20 px-6 py-4 bg-gradient-to-r from-bristol-maroon via-bristol-maroon/90 to-bristol-maroon/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", artifactColors[artifact.type])}>
              {artifactIcons[artifact.type]}
            </div>
            <div>
              <h3 className="font-semibold text-bristol-gold">{artifact.title}</h3>
              <div className="flex items-center gap-2 text-sm text-bristol-gold/70">
                <Badge variant="secondary" className="text-xs bg-bristol-cyan/20 text-bristol-cyan border-bristol-cyan/30">
                  {artifact.type.toUpperCase()}
                </Badge>
                {artifact.language && (
                  <Badge variant="outline" className="text-xs bg-bristol-gold/20 text-bristol-gold border-bristol-gold/30">
                    {artifact.language}
                  </Badge>
                )}
                {artifact.modelUsed && (
                  <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-400/30">
                    {artifact.modelUsed.split('/').pop()}
                  </Badge>
                )}
                <span className="text-bristol-gold/60">{artifact.createdAt.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(artifact.content)}
              className="gap-2 border-bristol-gold/30 text-bristol-gold hover:bg-bristol-gold/10"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            {onDownload && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDownload(artifact)}
                className="gap-2 border-bristol-gold/30 text-bristol-gold hover:bg-bristol-gold/10"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFullscreen(!fullscreen)}
              className="border-bristol-gold/30 text-bristol-gold hover:bg-bristol-gold/10"
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
              <pre className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-bristol-cyan p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap border border-bristol-cyan/20 shadow-lg shadow-bristol-cyan/10">
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
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 bg-gradient-to-br from-white via-slate-50/80 to-white p-4 rounded-lg border border-bristol-gold/20 shadow-sm">
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
        "flex flex-col bg-gradient-to-b from-white via-slate-50/80 to-white border-l border-bristol-gold/30 backdrop-blur-sm",
        fullscreen ? "fixed inset-0 z-50" : "h-full",
        className
      )}>
        {/* Panel Header */}
        <div className="flex-shrink-0 border-b border-bristol-gold/30 px-4 py-3 bg-gradient-to-r from-bristol-maroon via-bristol-maroon/95 to-bristol-maroon backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-bristol-gold" />
              <h2 className="font-semibold text-bristol-gold">Artifacts</h2>
              <Badge variant="secondary" className="text-xs bg-bristol-cyan/20 text-bristol-cyan border-bristol-cyan/30">
                {artifacts.length}
              </Badge>
            </div>
            {fullscreen && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFullscreen(false)}
                className="text-bristol-gold hover:bg-bristol-gold/10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Artifact List Sidebar */}
          <div className="w-80 border-r border-bristol-gold/20 bg-gradient-to-b from-slate-50 via-slate-100/50 to-slate-50 backdrop-blur-sm">
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
                          "hover:bg-white/80 hover:shadow-lg hover:shadow-bristol-gold/10 hover:border hover:border-bristol-gold/20 transition-all duration-300",
                          isSelected 
                            ? "bg-gradient-to-r from-white via-bristol-gold/5 to-white shadow-lg shadow-bristol-gold/20 border border-bristol-gold/30 ring-1 ring-bristol-gold/20" 
                            : "bg-white/30 backdrop-blur-sm"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("p-1.5 rounded-md", artifactColors[artifact.type])}>
                            {artifactIcons[artifact.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900 text-sm truncate">
                              {artifact.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs bg-bristol-cyan/10 text-bristol-cyan border-bristol-cyan/30">
                                {artifact.type.toUpperCase()}
                              </Badge>
                              {artifact.modelUsed && (
                                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-400/30">
                                  {artifact.modelUsed.split('/').pop()}
                                </Badge>
                              )}
                              <span className="text-xs text-slate-500">
                                {artifact.createdAt.toLocaleTimeString()}
                              </span>
                            </div>
                            {isExpanded && (
                              <div className="mt-2 text-xs text-slate-600 line-clamp-3 bg-slate-50/80 p-2 rounded border border-bristol-gold/10">
                                {artifact.content.slice(0, 100)}...
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(artifact.id);
                            }}
                            className="text-slate-400 hover:text-bristol-gold transition-colors duration-200"
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
              <div className="h-full flex items-center justify-center text-slate-500 bg-gradient-to-br from-slate-50 via-white/80 to-slate-50">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-bristol-gold/50 mx-auto mb-4" />
                  <p className="text-slate-600">Select an artifact to view its content</p>
                  <p className="text-xs text-bristol-gold/70 mt-2">Generated content will appear here</p>
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
export function extractArtifacts(content: string, messageId?: string, modelUsed?: string): Artifact[] {
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
        messageId,
        modelUsed
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
      messageId,
      modelUsed
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