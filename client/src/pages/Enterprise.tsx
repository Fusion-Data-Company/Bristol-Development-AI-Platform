import SimpleChrome from "../components/brand/SimpleChrome";

export default function Enterprise() {
  return (
    <SimpleChrome showNavigation={true}>
      <div className="container mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Enterprise Dashboard</h1>
          <p className="text-gray-600">Enterprise management tools coming soon.</p>
        </div>
      </div>
    </SimpleChrome>
  );
}