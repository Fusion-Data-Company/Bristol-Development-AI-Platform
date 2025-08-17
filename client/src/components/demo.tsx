import BoxLoader from "@/components/ui/box-loader";

export default function DemoOne() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-8 gradient-text-bristol">
          3D Box Loader Demo
        </h1>
        <div className="chrome-metallic-panel p-8 max-w-md mx-auto">
          <p className="text-gray-700 mb-6 font-medium">
            This is the animated 3D box loader component with Bristol Development Group branding.
          </p>
          <BoxLoader />
          <p className="text-sm text-gray-600 mt-6">
            The loader features four animated 3D boxes with Bristol's signature maroon and gold gradient colors.
          </p>
        </div>
      </div>
    </div>
  );
}