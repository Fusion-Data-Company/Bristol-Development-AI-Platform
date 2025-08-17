"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  MessageCircle,
  Sparkles,
  Wand2,
  Loader2,
  Play,
  Pause,
  RotateCw,
  History,
  AlertCircle,
  Palette,
  ImageIcon,
  Sun,
  User,
  Monitor,
  Cpu,
  RatioIcon as AspectRatio,
  Film,
  CuboidIcon as Cube,
  ArrowLeft,
  Clock,
  Search,
} from "lucide-react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type GenerationMode = "image" | "video" | "avatar"

interface GenerationSettings {
  style: string
  backgroundColor: string
  lighting: string
  pose: string
  aspectRatio: string
  aiModel: string
  resolution: string
  prompt: string
  negativePrompt: string
  seed?: number
  steps?: number
}

interface HistoryItem {
  id: string
  type: GenerationMode
  url: string
  prompt: string
  timestamp: Date
}

export function AIMultiModalGeneration() {
  const [mode, setMode] = useState<GenerationMode>("image")
  const [showForm, setShowForm] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  const [generatedItems, setGeneratedItems] = useState<HistoryItem[]>([
    {
      id: "1",
      type: "image",
      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      prompt: "Portrait of a woman with orange background",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: "2",
      type: "image",
      url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      prompt: "Professional headshot with blue background",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
  ])

  const [settings, setSettings] = useState<GenerationSettings>({
    style: "artistic",
    backgroundColor: "studio",
    lighting: "studio",
    pose: "profile",
    aspectRatio: "4:5",
    aiModel: "stable-diffusion-xl",
    resolution: "1024x1024",
    prompt: "",
    negativePrompt: "blurry, low quality, distorted features",
  })

  // Different placeholder prompts based on the mode
  const placeholderPrompts = {
    image: "Professional portrait with blue background, studio lighting",
    video: "Short video of a person walking in a park, cinematic lighting",
    avatar: "3D avatar of a young professional with glasses, detailed face",
  }

  // Different loading texts based on the mode
  const loadingTexts = {
    image: ["Creating your masterpiece...", "Finding the perfect colors...", "Adding the final touches..."],
    video: ["Generating video frames...", "Applying motion effects...", "Rendering your video..."],
    avatar: ["Building 3D mesh...", "Applying textures...", "Finalizing your avatar..."],
  }

  // Different AI models based on the mode
  const aiModels = {
    image: [
      { value: "stable-diffusion-xl", label: "Stable Diffusion XL" },
      { value: "midjourney-v5", label: "Midjourney v5" },
      { value: "dalle-3", label: "DALL-E 3" },
      { value: "imagen", label: "Imagen" },
    ],
    video: [
      { value: "gen-2", label: "Gen-2" },
      { value: "runway-gen-2", label: "Runway Gen-2" },
      { value: "pika-labs", label: "Pika Labs" },
      { value: "sora", label: "Sora" },
    ],
    avatar: [
      { value: "dreamshaper-3d", label: "DreamShaper 3D" },
      { value: "3d-diffusion", label: "3D Diffusion" },
      { value: "meshy", label: "Meshy" },
      { value: "luma", label: "Luma AI" },
    ],
  }

  // Different resolutions based on the mode
  const resolutions = {
    image: [
      { value: "512x512", label: "512×512" },
      { value: "768x768", label: "768×768" },
      { value: "1024x1024", label: "1024×1024" },
      { value: "1536x1536", label: "1536×1536" },
    ],
    video: [
      { value: "512x512", label: "512×512" },
      { value: "768x768", label: "768×768" },
      { value: "1024x576", label: "1024×576 (16:9)" },
      { value: "1280x720", label: "1280×720 (HD)" },
    ],
    avatar: [
      { value: "512x512", label: "512×512" },
      { value: "768x768", label: "768×768" },
      { value: "1024x1024", label: "1024×1024" },
      { value: "2048x2048", label: "2048×2048" },
    ],
  }

  // Suggestions based on the mode
  useEffect(() => {
    if (mode === "image") {
      setPromptSuggestions([
        "Professional headshot with neutral background",
        "Artistic portrait with dramatic lighting",
        "Casual portrait in natural outdoor setting",
      ])
    } else if (mode === "video") {
      setPromptSuggestions([
        "Person walking in urban environment, cinematic lighting",
        "Close-up of face with changing expressions",
        "Rotating view of subject in studio setting",
      ])
    } else {
      setPromptSuggestions([
        "Realistic 3D avatar with professional attire",
        "Stylized cartoon character with expressive features",
        "Detailed 3D bust with photorealistic textures",
      ])
    }
  }, [mode])

  // Loading progress effect
  useEffect(() => {
    if (!isLoading) {
      setProgress(0)
      return
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + (mode === "image" ? 1.5 : mode === "video" ? 0.8 : 0.5)
      })
    }, 30)

    return () => clearInterval(interval)
  }, [isLoading, mode])

  // Loading text rotation effect
  useEffect(() => {
    if (!isLoading) return

    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % loadingTexts[mode].length)
    }, 1500)

    return () => clearInterval(interval)
  }, [isLoading, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowForm(false)
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call with different loading times based on mode
      const loadingTime = mode === "image" ? 3000 : mode === "video" ? 5000 : 7000
      await new Promise((resolve) => setTimeout(resolve, loadingTime))

      // Add the new generated item to the list
      const newItem = {
        id: Date.now().toString(),
        type: mode,
        url: mode === "image"
          ? "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face"
          : mode === "video"
            ? "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400&h=400&fit=crop&crop=face"
            : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        prompt: settings.prompt || "AI generated content",
        timestamp: new Date(),
      }

      setGeneratedItems((prev) => [newItem, ...prev])
      setShowForm(false)
    } catch (err) {
      setError(`Failed to generate ${mode}. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToSettings = () => {
    setShowForm(true)
    setShowHistory(false)
    setError(null)
  }

  const handleModeChange = (newMode: GenerationMode) => {
    setMode(newMode)
    setShowForm(true)
    setShowHistory(false)
    setError(null)
  }

  const handleViewHistory = () => {
    setShowForm(false)
    setShowHistory(true)
  }

  const handleSelectHistoryItem = (id: string) => {
    const item = generatedItems.find((item) => item.id === id)
    if (item) {
      setMode(item.type)
      setShowHistory(false)
      setShowForm(false)
    }
  }

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSettings({
      ...settings,
      prompt: e.target.value,
    })
  }

  const handleNegativePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSettings({
      ...settings,
      negativePrompt: e.target.value,
    })
  }

  const handleSeedChange = (value: number[]) => {
    setSettings({
      ...settings,
      seed: value[0],
    })
  }

  const handleStepsChange = (value: number[]) => {
    setSettings({
      ...settings,
      steps: value[0],
    })
  }

  const applyPromptSuggestion = (suggestion: string) => {
    setSettings({
      ...settings,
      prompt: suggestion,
    })
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleRotate = () => {
    setIsRotating(!isRotating)
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    return date.toLocaleDateString()
  }

  const filteredItems = generatedItems.filter((item) => item.prompt.toLowerCase().includes(searchQuery.toLowerCase()))

  // Render Header Component
  const renderHeader = () => (
    <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">AI Multi-Modal Generation</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Create stunning AI-generated content</p>
        </div>
      </div>
      <button
        onClick={handleViewHistory}
        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <History className="w-4 h-4 text-zinc-500" />
      </button>
    </div>
  )

  // Render Error Component
  const renderError = () =>
    error && (
      <div className="m-4 px-4 py-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-xl">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <p>{error}</p>
      </div>
    )

  // Render Form Component
  const renderForm = () => (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1 p-4 justify-between">
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-500">Prompt</span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Wand2 className="w-3.5 h-3.5 text-zinc-500" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2">
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-zinc-500">Suggestions</h4>
                  <div className="space-y-1">
                    {promptSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => applyPromptSuggestion(suggestion)}
                        className="w-full text-left p-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Textarea
            value={settings.prompt}
            onChange={handlePromptChange}
            placeholder={placeholderPrompts[mode]}
            className="w-full min-h-[80px] bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 rounded-xl focus:outline-none focus-visible:ring-offset-0 focus-visible:ring-0 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="advanced-mode" checked={advancedMode} onCheckedChange={setAdvancedMode} />
          <Label htmlFor="advanced-mode" className="text-xs text-zinc-500">
            Advanced Mode
          </Label>
        </div>

        {advancedMode && (
          <div className="space-y-3 p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl">
            <div className="space-y-2">
              <label className="text-xs text-zinc-500">Negative Prompt</label>
              <Textarea
                value={settings.negativePrompt}
                onChange={handleNegativePromptChange}
                placeholder="Elements to avoid in generation"
                className="w-full min-h-[60px] bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-500">Seed</label>
                <span className="text-xs text-zinc-700 dark:text-zinc-300">{settings.seed || 0}</span>
              </div>
              <Slider defaultValue={[settings.seed || 0]} max={1000000} step={1} onValueChange={handleSeedChange} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-500">Steps</label>
                <span className="text-xs text-zinc-700 dark:text-zinc-300">{settings.steps || 30}</span>
              </div>
              <Slider
                defaultValue={[settings.steps || 30]}
                min={10}
                max={150}
                step={1}
                onValueChange={handleStepsChange}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {renderSettings()}

        <button
          type="submit"
          className="w-full h-10 flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-600 hover:to-violet-600 text-white text-sm font-medium rounded-xl transition-colors self-end"
        >
          <Sparkles className="w-4 h-4" />
          Generate {mode === "image" ? "Portrait" : mode === "video" ? "Video" : "Avatar"}
        </button>
      </div>
    </form>
  )

  // Render Settings Component
  const renderSettings = () => (
    <div className="space-y-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
      {/* AI Model Select */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-zinc-500" />
          <span className="text-sm text-zinc-500">AI Model</span>
        </div>
        <Select value={settings.aiModel} onValueChange={(value) => setSettings({ ...settings, aiModel: value })}>
          <SelectTrigger className="w-[160px] h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {aiModels[mode].map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resolution Select */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-zinc-500" />
          <span className="text-sm text-zinc-500">Resolution</span>
        </div>
        <Select value={settings.resolution} onValueChange={(value) => setSettings({ ...settings, resolution: value })}>
          <SelectTrigger className="w-[160px] h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {resolutions[mode].map((res) => (
              <SelectItem key={res.value} value={res.value}>
                {res.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Style Select */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-zinc-500" />
          <span className="text-sm text-zinc-500">Style</span>
        </div>
        <Select value={settings.style} onValueChange={(value) => setSettings({ ...settings, style: value })}>
          <SelectTrigger className="w-[160px] h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="artistic">Artistic</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="vintage">Vintage</SelectItem>
            {mode === "avatar" && <SelectItem value="cartoon">Cartoon</SelectItem>}
            {mode === "avatar" && <SelectItem value="anime">Anime</SelectItem>}
            {mode === "video" && <SelectItem value="cinematic">Cinematic</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      {/* Background Select */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-zinc-500" />
          <span className="text-sm text-zinc-500">Background</span>
        </div>
        <Select
          value={settings.backgroundColor}
          onValueChange={(value) =>
            setSettings({
              ...settings,
              backgroundColor: value,
            })
          }
        >
          <SelectTrigger className="w-[160px] h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="studio">Studio</SelectItem>
            <SelectItem value="gradient">Gradient</SelectItem>
            <SelectItem value="solid">Solid Color</SelectItem>
            <SelectItem value="transparent">Transparent</SelectItem>
            {mode !== "avatar" && <SelectItem value="outdoor">Outdoor</SelectItem>}
            {mode !== "avatar" && <SelectItem value="office">Office</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      {/* Lighting Select */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-zinc-500" />
          <span className="text-sm text-zinc-500">Lighting</span>
        </div>
        <Select value={settings.lighting} onValueChange={(value) => setSettings({ ...settings, lighting: value })}>
          <SelectTrigger className="w-[160px] h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="soft">Soft</SelectItem>
            <SelectItem value="dramatic">Dramatic</SelectItem>
            <SelectItem value="natural">Natural</SelectItem>
            <SelectItem value="studio">Studio</SelectItem>
            {mode === "video" && <SelectItem value="cinematic">Cinematic</SelectItem>}
            {mode === "video" && <SelectItem value="golden-hour">Golden Hour</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      {/* Aspect Ratio Select */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AspectRatio className="w-4 h-4 text-zinc-500" />
          <span className="text-sm text-zinc-500">Aspect Ratio</span>
        </div>
        <Select
          value={settings.aspectRatio}
          onValueChange={(value) => setSettings({ ...settings, aspectRatio: value })}
        >
          <SelectTrigger className="w-[160px] h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1:1">1:1 Square</SelectItem>
            <SelectItem value="4:5">4:5 Portrait</SelectItem>
            <SelectItem value="3:4">3:4 Portrait</SelectItem>
            <SelectItem value="16:9">16:9 Landscape</SelectItem>
            {mode === "video" && <SelectItem value="9:16">9:16 Vertical</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      {/* Pose Select - Only for image and avatar */}
      {mode !== "video" && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">Pose</span>
          </div>
          <Select value={settings.pose} onValueChange={(value) => setSettings({ ...settings, pose: value })}>
            <SelectTrigger className="w-[160px] h-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="headshot">Headshot</SelectItem>
              <SelectItem value="half-body">Half Body</SelectItem>
              <SelectItem value="full-body">Full Body</SelectItem>
              <SelectItem value="profile">Profile</SelectItem>
              {mode === "avatar" && <SelectItem value="bust">Bust</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )

  // Render Preview Component
  const renderPreview = () => (
    <div className="p-4">
      <div className="rounded-xl mb-4 flex items-center justify-center">
        {isLoading ? (
          <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <div className="relative w-16 h-16">
                <Loader2 className="w-full h-full animate-spin text-fuchsia-500" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-fuchsia-500/10 rounded-full animate-spin-slow" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {loadingTexts[mode][currentTextIndex]}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {mode === "image"
                    ? "This usually takes 10-15 seconds"
                    : mode === "video"
                      ? "This usually takes 20-30 seconds"
                      : "This usually takes 30-45 seconds"}
                </p>
              </div>
              <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500 transition-all duration-300 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="relative w-full rounded-xl overflow-hidden">
              <img
                src={generatedItems[0]?.url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"}
                width={400}
                height={400}
                alt={`AI generated ${mode}`}
                className={`rounded-xl object-cover w-full h-full ${isRotating ? "animate-spin-slow" : ""}`}
              />

              {mode !== "image" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white ml-1" />
                    )}
                  </button>
                </div>
              )}

              {mode === "avatar" && (
                <button
                  onClick={toggleRotate}
                  className="absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                >
                  <RotateCw className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {!isLoading && (
        <div className="space-y-4">
          <div className="p-3 space-y-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Quality</span>
              <span className="text-zinc-900 dark:text-zinc-100">{settings.resolution}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Model</span>
              <span className="text-zinc-900 dark:text-zinc-100">{settings.aiModel}</span>
            </div>
            {mode === "video" && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Duration</span>
                <span className="text-zinc-900 dark:text-zinc-100">00:07</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleBackToSettings} className="flex-1 mr-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
            <Button onClick={() => {}} className="flex-1 ml-2">
              <Clock className="w-4 h-4 mr-2" />
              Generate Another
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  // Render History Component
  const renderHistory = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Generation History</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-8 bg-zinc-100 dark:bg-zinc-800"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleSelectHistoryItem(item.id)}
            className="group p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 cursor-pointer transition-colors"
          >
            <div className="flex items-start gap-3">
              <img
                src={item.url}
                alt="Generated content"
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    {item.type}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {formatDate(item.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 group-hover:text-zinc-700 dark:group-hover:text-zinc-300">
                  {item.prompt}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // Main render logic
  return (
    <div className="h-screen w-full bg-white dark:bg-zinc-900 flex flex-col overflow-hidden">
      {renderHeader()}
      {renderError()}

      {/* Mode Selection Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <Tabs value={mode} onValueChange={(value) => handleModeChange(value as GenerationMode)}>
          <TabsList className="w-full h-12 bg-transparent p-0 justify-start">
            <TabsTrigger
              value="image"
              className="h-full px-6 data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800 border-b-2 border-transparent data-[state=active]:border-fuchsia-500 rounded-none"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Image
            </TabsTrigger>
            <TabsTrigger
              value="video"
              className="h-full px-6 data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800 border-b-2 border-transparent data-[state=active]:border-fuchsia-500 rounded-none"
            >
              <Film className="w-4 h-4 mr-2" />
              Video
            </TabsTrigger>
            <TabsTrigger
              value="avatar"
              className="h-full px-6 data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800 border-b-2 border-transparent data-[state=active]:border-fuchsia-500 rounded-none"
            >
              <Cube className="w-4 h-4 mr-2" />
              Avatar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {showHistory ? renderHistory() : showForm ? renderForm() : renderPreview()}
      </div>
    </div>
  )
}