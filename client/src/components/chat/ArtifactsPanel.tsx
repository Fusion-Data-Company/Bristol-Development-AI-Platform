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
  document: 'text-slate-300 bg-slate-200/10 border-slate-300/30',
  image: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  data: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  chart: 'text-bristol-cyan bg-bristol-cyan/10 border-bristol-cyan/30',
  other: 'text-slate-300 bg-slate-200/10 border-slate-300/30'
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
      <div className="flex-shrink-0 border-b border-bristol-cyan/20 px-6 py-4 bg-gradient-to-r from-slate-900/40 via-slate-800/50 to-slate-900/40 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg backdrop-blur-sm", artifactColors[artifact.type])}>
              {artifactIcons[artifact.type]}
            </div>
            <div>
              <h3 className="font-semibold text-white">{artifact.title}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Badge variant="secondary" className="text-xs bg-bristol-cyan/20 text-bristol-cyan border-bristol-cyan/40 shadow-sm shadow-bristol-cyan/20">
                  {artifact.type.toUpperCase()}
                </Badge>
                {artifact.language && (
                  <Badge variant="outline" className="text-xs bg-slate-200/10 text-slate-300 border-slate-300/30">
                    {artifact.language}
                  </Badge>
                )}
                {artifact.modelUsed && (
                  <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-400/30">
                    {artifact.modelUsed.split('/').pop()}
                  </Badge>
                )}
                <span className="text-slate-400">{artifact.createdAt.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(artifact.content)}
              className="gap-2 border-bristol-cyan/30 text-bristol-cyan hover:bg-bristol-cyan/10 hover:shadow-lg hover:shadow-bristol-cyan/20 transition-all duration-300"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            {onDownload && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDownload(artifact)}
                className="gap-2 border-bristol-cyan/30 text-bristol-cyan hover:bg-bristol-cyan/10 hover:shadow-lg hover:shadow-bristol-cyan/20 transition-all duration-300"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFullscreen(!fullscreen)}
              className="border-bristol-cyan/30 text-bristol-cyan hover:bg-bristol-cyan/10 hover:shadow-lg hover:shadow-bristol-cyan/20 transition-all duration-300"
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
              <pre className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-bristol-cyan p-6 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap border border-bristol-cyan/30 shadow-xl shadow-bristol-cyan/10 backdrop-blur-sm">
                <code>{artifact.content}</code>
              </pre>
            ) : artifact.type === 'image' ? (
              <div className="flex justify-center">
                <img 
                  src={artifact.content} 
                  alt={artifact.title}
                  className="max-w-full h-auto rounded-lg shadow-xl border border-bristol-cyan/20"
                />
              </div>
            ) : (
              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 bg-gradient-to-br from-white via-slate-50/90 to-white/95 p-6 rounded-lg border border-bristol-cyan/20 shadow-xl backdrop-blur-sm">
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
      {/* Full-Width Artifacts Panel */}
      <div className={cn(
        "flex flex-col bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl border border-bristol-cyan/20 shadow-2xl shadow-bristol-cyan/10",
        fullscreen ? "fixed inset-0 z-50" : "h-full",
        className
      )}>
        {/* Panel Header with Navigation Tabs */}
        <div className="flex-shrink-0 border-b border-bristol-cyan/30 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900/60 via-slate-800/70 to-slate-900/60">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-bristol-cyan" />
              <h2 className="font-semibold text-bristol-cyan text-lg">Artifacts</h2>
              <Badge variant="secondary" className="text-xs bg-bristol-cyan/20 text-bristol-cyan border-bristol-cyan/40 shadow-lg shadow-bristol-cyan/20">
                {artifacts.length}
              </Badge>
            </div>
            {fullscreen && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFullscreen(false)}
                className="text-bristol-cyan hover:bg-bristol-cyan/10 hover:shadow-lg hover:shadow-bristol-cyan/20 transition-all duration-300"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Navigation Tabs */}
          <div className="px-6 pb-2">
            <div className="flex gap-2 overflow-x-auto">
              {artifacts.map((artifact) => {
                const isSelected = selectedArtifact === artifact.id;
                
                return (
                  <button
                    key={artifact.id}
                    onClick={() => setSelectedArtifact(artifact.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap",
                      "border backdrop-blur-sm",
                      isSelected 
                        ? "bg-gradient-to-r from-bristol-cyan/20 via-bristol-cyan/15 to-bristol-cyan/20 text-bristol-cyan border-bristol-cyan/40 shadow-lg shadow-bristol-cyan/20" 
                        : "bg-slate-800/50 text-slate-300 border-slate-600/30 hover:bg-slate-700/60 hover:text-white hover:border-bristol-cyan/30 hover:shadow-md hover:shadow-bristol-cyan/10"
                    )}
                  >
                    <div className={cn("p-1 rounded-md", artifactColors[artifact.type])}>
                      {artifactIcons[artifact.type]}
                    </div>
                    <span className="truncate max-w-32">{artifact.title}</span>
                    <Badge variant="outline" className="text-xs bg-transparent border-current/30">
                      {artifact.type.toUpperCase()}
                    </Badge>
                    {artifact.modelUsed && (
                      <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-400/30">
                        {artifact.modelUsed.split('/').pop()}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Artifact Content Display - Full Width */}
        <div className="flex-1 overflow-hidden">
          {selectedArtifactData ? (
            <ArtifactContent artifact={selectedArtifactData} />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 bg-gradient-to-br from-slate-900/40 via-slate-800/50 to-slate-900/40 backdrop-blur-sm">
              <div className="text-center">
                <FileText className="h-16 w-16 text-bristol-cyan/50 mx-auto mb-6" />
                <p className="text-slate-300 text-lg font-medium">Select an artifact to view its content</p>
                <p className="text-xs text-bristol-cyan/70 mt-3">Generated content will appear here with full-width display</p>
              </div>
            </div>
          )}
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