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
  code: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/30',
  document: 'text-brand-cyan bg-brand-cyan/15 border-brand-cyan/40 shadow-lg shadow-brand-cyan/20',
  image: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  data: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  chart: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/30',
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
      <div className="flex-shrink-0 border-b border-brand-cyan/20 px-8 py-6 bg-gradient-to-r from-slate-900/40 via-slate-800/50 to-slate-900/40 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-xl backdrop-blur-sm shadow-lg", artifactColors[artifact.type])}>
              {artifactIcons[artifact.type]}
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{artifact.title}</h3>
              <div className="flex items-center gap-3 text-sm text-slate-300 mt-2">
                <Badge variant="secondary" className="text-sm bg-brand-cyan/20 text-brand-cyan border-brand-cyan/40 shadow-lg shadow-brand-cyan/20 px-3 py-1">
                  {artifact.type.toUpperCase()}
                </Badge>
                {artifact.language && (
                  <Badge variant="outline" className="text-sm bg-slate-200/10 text-slate-300 border-slate-300/30 px-3 py-1">
                    {artifact.language}
                  </Badge>
                )}
                {artifact.modelUsed && (
                  <Badge variant="outline" className="text-sm bg-green-500/20 text-green-400 border-green-400/30 px-3 py-1">
                    {artifact.modelUsed.split('/').pop()}
                  </Badge>
                )}
                <span className="text-slate-400">{artifact.createdAt.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="default"
              variant="outline"
              onClick={() => handleCopy(artifact.content)}
              className="gap-2 bg-slate-800/60 border-brand-cyan/50 text-brand-cyan hover:bg-brand-cyan/15 hover:border-brand-cyan/70 hover:shadow-xl hover:shadow-brand-cyan/20 transition-all duration-300 px-4 py-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            {onDownload && (
              <Button
                size="default"
                variant="outline"
                onClick={() => onDownload(artifact)}
                className="gap-2 bg-slate-800/60 border-brand-cyan/50 text-brand-cyan hover:bg-brand-cyan/15 hover:border-brand-cyan/70 hover:shadow-xl hover:shadow-brand-cyan/20 transition-all duration-300 px-4 py-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
            <Button
              size="default"
              variant="outline"
              onClick={() => setFullscreen(!fullscreen)}
              className="bg-slate-800/60 border-brand-cyan/50 text-brand-cyan hover:bg-brand-cyan/15 hover:border-brand-cyan/70 hover:shadow-xl hover:shadow-brand-cyan/20 transition-all duration-300 px-4 py-2"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Artifact Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-8">
            {artifact.type === 'code' ? (
              <pre className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-brand-cyan p-8 rounded-xl overflow-x-auto text-base font-mono whitespace-pre-wrap border border-brand-cyan/30 shadow-2xl shadow-brand-cyan/20 backdrop-blur-sm">
                <code>{artifact.content}</code>
              </pre>
            ) : artifact.type === 'image' ? (
              <div className="flex justify-center">
                <img 
                  src={artifact.content} 
                  alt={artifact.title}
                  className="max-w-full h-auto rounded-xl shadow-2xl border border-brand-cyan/20"
                />
              </div>
            ) : (
              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-base leading-loose text-slate-800 bg-gradient-to-br from-white via-slate-50/90 to-white/95 p-8 rounded-xl border border-brand-cyan/20 shadow-2xl backdrop-blur-sm">
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
      {/* Half-Screen Artifacts Panel */}
      <div className={cn(
        "flex flex-col bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl border border-brand-cyan/20 shadow-2xl shadow-brand-cyan/10",
        fullscreen ? "fixed inset-4 z-50 rounded-xl" : "h-full min-w-0 flex-1",
        className
      )}>
        {/* Panel Header with Navigation Tabs */}
        <div className="flex-shrink-0 border-b border-brand-cyan/30 backdrop-blur-sm">
          <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-slate-900/60 via-slate-800/70 to-slate-900/60">
            <div className="flex items-center gap-4">
              <FileText className="h-7 w-7 text-brand-cyan" />
              <h2 className="font-semibold text-brand-cyan text-xl">Artifacts</h2>
              <Badge variant="secondary" className="text-sm bg-brand-cyan/20 text-brand-cyan border-brand-cyan/40 shadow-lg shadow-brand-cyan/20 px-3 py-1">
                {artifacts.length}
              </Badge>
            </div>
            {fullscreen && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFullscreen(false)}
                className="text-brand-cyan hover:bg-brand-cyan/10 hover:shadow-lg hover:shadow-brand-cyan/20 transition-all duration-300"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Navigation Tabs */}
          <div className="px-8 pb-4">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {artifacts.map((artifact) => {
                const isSelected = selectedArtifact === artifact.id;
                
                return (
                  <button
                    key={artifact.id}
                    onClick={() => setSelectedArtifact(artifact.id)}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap min-w-fit",
                      "border backdrop-blur-sm shadow-lg",
                      isSelected 
                        ? "bg-gradient-to-r from-brand-cyan/25 via-brand-cyan/20 to-brand-cyan/25 text-brand-cyan border-brand-cyan/50 shadow-xl shadow-brand-cyan/30" 
                        : "bg-slate-800/60 text-slate-300 border-slate-600/40 hover:bg-slate-700/70 hover:text-white hover:border-brand-cyan/40 hover:shadow-xl hover:shadow-brand-cyan/20 hover:scale-105"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg", artifactColors[artifact.type])}>
                      {artifactIcons[artifact.type]}
                    </div>
                    <span className="truncate max-w-40 font-medium">{artifact.title}</span>
                    <Badge variant="outline" className="text-xs bg-brand-cyan/20 text-brand-cyan border-brand-cyan/50 shadow-md shadow-brand-cyan/20 px-2 py-1">
                      {artifact.type.toUpperCase()}
                    </Badge>
                    {artifact.modelUsed && (
                      <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-400/40 px-2 py-1">
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
              <div className="text-center p-12">
                <FileText className="h-20 w-20 text-brand-cyan/50 mx-auto mb-8" />
                <p className="text-slate-300 text-xl font-medium mb-4">Select an artifact to view its content</p>
                <p className="text-sm text-brand-cyan/70 leading-relaxed">Generated content will appear here with full-width display for optimal readability</p>
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