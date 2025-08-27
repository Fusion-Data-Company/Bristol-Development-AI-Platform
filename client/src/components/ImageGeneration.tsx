import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Image, Download, Sparkles } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ImageGenerationProps {
  onImageGenerated?: (imageUrl: string) => void;
}

export const ImageGeneration: React.FC<ImageGenerationProps> = ({ onImageGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('standard');
  const [style, setStyle] = useState('vivid');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description for the image you want to generate.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size, quality, style })
      });

      if (response.success) {
        setGeneratedImage(response.imageUrl);
        onImageGenerated?.(response.imageUrl);
        toast({
          title: "Image Generated Successfully",
          description: "Your image has been created with DALL-E 3.",
        });
      } else {
        throw new Error(response.message || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Failed to generate image. Please try again.',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brand-ai-generated-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Image Downloaded",
        description: "The image has been saved to your downloads folder.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the image. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-white/10 to-white/5 border-brand-gold/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-brand-gold">
          <Sparkles className="h-5 w-5" />
          DALL-E 3 Image Generation
          <div className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-bold">
            ELITE
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/90">Image Description</label>
          <Input
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-black/20 border-brand-cyan/30 text-white placeholder:text-white/50"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">Size</label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger className="bg-black/20 border-brand-cyan/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1024x1024">1024×1024 (Square)</SelectItem>
                <SelectItem value="1792x1024">1792×1024 (Landscape)</SelectItem>
                <SelectItem value="1024x1792">1024×1792 (Portrait)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">Quality</label>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger className="bg-black/20 border-brand-cyan/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="hd">HD (Higher Quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">Style</label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-black/20 border-brand-cyan/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vivid">Vivid (Dramatic)</SelectItem>
                <SelectItem value="natural">Natural (Realistic)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={loading || !prompt.trim()}
          className="w-full bg-gradient-to-r from-brand-gold to-brand-cyan hover:from-brand-gold/80 hover:to-brand-cyan/80 text-black font-bold"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Image...
            </>
          ) : (
            <>
              <Image className="h-4 w-4 mr-2" />
              Generate Image
            </>
          )}
        </Button>

        {generatedImage && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border border-brand-gold/30">
              <img 
                src={generatedImage} 
                alt="Generated image" 
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
            <Button 
              onClick={handleDownload}
              variant="outline"
              className="w-full border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Image
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};