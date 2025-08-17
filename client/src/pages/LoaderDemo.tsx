import { Component } from "@/components/ui/3d-effect-loader";

export default function LoaderDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-8">3D Effect Loader Demo</h1>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <Component />
          <p className="text-white/80 mt-4">Bristol Development Group</p>
          <p className="text-white/60 text-sm">Enterprise-grade loading animation</p>
        </div>
      </div>
    </div>
  );
}