import { ThreeJSSandbox as ThreeJSComponent } from '@/components/visualization/ThreeJSSandbox';
import SimpleChrome from '@/components/brand/SimpleChrome';

export default function ThreeJSSandbox() {
  return (
    <SimpleChrome>
      <div className="h-screen">
        <ThreeJSComponent />
      </div>
    </SimpleChrome>
  );
}