"use client"

import React, { useState } from "react"
import {
  ImageIcon,
  Film,
  User,
  Loader2,
  Sparkles,
  Settings,
  X,
  Download,
  Play
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

type GenerationMode = "image" | "video" | "avatar"

interface GenerationResult {
  id: string
  type: GenerationMode
  url: string
  prompt: string
  timestamp: Date
}

export function AIMultiModalGeneration() {
  const [mode, setMode] = useState<GenerationMode>("image")
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [results, setResults] = useState<GenerationResult[]>([])
  const [isEnhancing, setIsEnhancing] = useState(false)

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;
    
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/ai-generation/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          mode
        }),
      });

      const data = await response.json();
      if (data.success && data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
      }
    } catch (error) {
      console.error('Prompt enhancement failed:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    
    try {
      if (mode === "image") {
        // Call OpenAI DALL-E API
        const response = await fetch('/api/ai-generation/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            size: "1024x1024",
            quality: showAdvanced ? "hd" : "standard",
            style: "vivid"
          }),
        });

        const data = await response.json();

        if (data.success && data.imageUrl) {
          const newResult: GenerationResult = {
            id: Date.now().toString(),
            type: mode,
            url: data.imageUrl,
            prompt: data.revisedPrompt || prompt,
            timestamp: new Date()
          };
          
          setResults(prev => [newResult, ...prev]);
        } else {
          console.error('Image generation failed:', data.error);
          alert(`Image generation failed: ${data.error || 'Unknown error'}`);
        }
      } else {
        // For video and avatar modes, show coming soon message
        alert(`${mode} generation is coming soon! Currently only image generation with DALL-E 3 is available.`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate content. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  const modeConfigs = {
    image: {
      icon: ImageIcon,
      title: "Image Generation",
      description: "Create stunning AI-generated images",
      placeholder: "A professional portrait with studio lighting, high quality"
    },
    video: {
      icon: Film,
      title: "Video Generation", 
      description: "Generate AI-powered video content",
      placeholder: "A short cinematic clip of a person walking in a modern office"
    },
    avatar: {
      icon: User,
      title: "3D Avatar Creation",
      description: "Build realistic 3D avatars",
      placeholder: "A detailed 3D avatar of a professional with glasses and business attire"
    }
  }

  const currentConfig = modeConfigs[mode]
  const CurrentIcon = currentConfig.icon

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-zinc-900 dark:to-zinc-800">
      {/* Header */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              AI Multi-Modal Generation
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Create images, videos, and avatars with AI
            </p>
          </div>
        </div>
        
        {/* Mode Selection */}
        <div className="mt-4 flex gap-2">
          {(Object.keys(modeConfigs) as GenerationMode[]).map((modeKey) => {
            const config = modeConfigs[modeKey]
            const ModeIcon = config.icon
            return (
              <button
                key={modeKey}
                onClick={() => setMode(modeKey)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  mode === modeKey
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                }`}
              >
                <ModeIcon className="w-4 h-4" />
                <span className="text-sm font-medium capitalize">{modeKey}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Generation Panel */}
        <div className="flex-1 p-6 space-y-6">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CurrentIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white">
                    {currentConfig.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {currentConfig.description}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Describe what you want to create
                  </Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={currentConfig.placeholder}
                    className="mt-2 min-h-[100px] resize-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="advanced"
                        checked={showAdvanced}
                        onCheckedChange={setShowAdvanced}
                      />
                      <Label htmlFor="advanced" className="text-sm text-zinc-600 dark:text-zinc-400">
                        Advanced settings
                      </Label>
                    </div>
                    
                    <Button
                      onClick={handleEnhancePrompt}
                      disabled={!prompt.trim() || isEnhancing || isGenerating}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      {isEnhancing ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Enhancing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 mr-1" />
                          Enhance with GPT-4o
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating with DALL-E 3...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate {mode}
                      </>
                    )}
                  </Button>
                </div>

                {showAdvanced && (
                  <div className="border-t pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-zinc-600 dark:text-zinc-400">Quality</Label>
                        <div className="mt-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-700 rounded">High</div>
                      </div>
                      <div>
                        <Label className="text-zinc-600 dark:text-zinc-400">Style</Label>
                        <div className="mt-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-700 rounded">Photorealistic</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="w-80 border-l border-zinc-200 dark:border-zinc-700 p-6 bg-white/30 dark:bg-zinc-900/30">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">
            Recent Generations
          </h3>
          
          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Your generations will appear here</p>
              </div>
            ) : (
              results.map((result) => (
                <Card key={result.id} className="overflow-hidden border-0 shadow-md">
                  <div className="aspect-square bg-zinc-100 dark:bg-zinc-800">
                    {result.type === "image" ? (
                      <img
                        src={result.url}
                        alt={result.prompt}
                        className="w-full h-full object-cover"
                      />
                    ) : result.type === "video" ? (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                        <Play className="w-12 h-12 text-white opacity-70" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                        <User className="w-12 h-12 text-blue-600 dark:text-blue-400 opacity-70" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {result.prompt}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-zinc-500 capitalize">
                        {result.type}
                      </span>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}