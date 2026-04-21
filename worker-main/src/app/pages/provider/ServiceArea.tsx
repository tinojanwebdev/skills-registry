import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Save, AlertTriangle } from 'lucide-react';
import { MapView, redIcon } from '../../components/MapView';

export const ServiceArea = () => {
  const { user, updateProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get('new') === '1';
  const [latitude, setLatitude] = useState(Number(user?.latitude) || 0);
  const [longitude, setLongitude] = useState(Number(user?.longitude) || 0);
  const [radius, setRadius] = useState(user?.radius || 10);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Auto-trigger location for new sellers
  useEffect(() => {
    if (isNew && latitude === 0 && longitude === 0) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => { setLatitude(pos.coords.latitude); setLongitude(pos.coords.longitude); },
          () => {}
        );
      }
    }
  }, [isNew]);

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLatitude(pos.coords.latitude); setLongitude(pos.coords.longitude); },
        () => alert('Unable to get your location.')
      );
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ latitude, longitude, radius });
      setSaved(true);
    } catch { /* empty */ }
    finally { setSaving(false); }
  };

  const hasLocation = latitude !== 0 && longitude !== 0;

  return (
    <div>
      <h1 className="text-3xl mb-6">Service Area</h1>

      {/* Trilingual message for new sellers */}
      {isNew && !saved && (
        <div className="mb-6 rounded-xl overflow-hidden shadow-md">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-amber-800">⚠️ You must save your location to be visible to customers!</p>
                  <p className="text-sm text-amber-700 mt-1">Please set your service location and click "Save Area" so customers can find you on the map.</p>
                </div>
                <div className="border-t border-amber-200 pt-3">
                  <p className="font-medium text-amber-800">⚠️ வாடிக்கையாளர்களுக்குத் தெரிய உங்கள் இருப்பிடத்தைச் சேமிக்க வேண்டும்!</p>
                  <p className="text-sm text-amber-700 mt-1">உங்கள் சேவை இருப்பிடத்தை அமைத்து "Save Area" பொத்தானை அழுத்தவும், வாடிக்கையாளர்கள் உங்களை வரைபடத்தில் கண்டுபிடிக்க முடியும்.</p>
                </div>
                <div className="border-t border-amber-200 pt-3">
                  <p className="font-medium text-amber-800">⚠️ පාරිභෝගිකයින්ට ඔබව සොයා ගැනීමට ඔබේ ස්ථානය සුරැකිය යුතුය!</p>
                  <p className="text-sm text-amber-700 mt-1">කරුණාකර ඔබේ සේවා ස්ථානය සකසා "Save Area" බොත්තම ක්ලික් කරන්න, එවිට පාරිභෝගිකයින්ට සිතියමේ ඔබව සොයා ගත හැක.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {saved && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          ✅ Location saved successfully! Customers can now find you on the map.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl mb-6">Set Your Service Location</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2 text-gray-700">Latitude</label>
              <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Longitude</label>
              <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700">Radius: {radius} km</label>
              <input type="range" min="1" max="50" value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} className="w-full" />
              <div className="flex justify-between text-xs text-gray-500 mt-1"><span>1 km</span><span>50 km</span></div>
            </div>
            <button onClick={handleUseMyLocation} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <MapPin className="w-5 h-5" />Use My Location
            </button>
            <button onClick={handleSave} disabled={saving} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" />{saving ? 'Saving...' : 'Save Area'}
            </button>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="mb-2 text-indigo-700">Current Service Area</h3>
            <div className="text-sm space-y-1">
              <p><span className="text-gray-600">Location:</span> {latitude.toFixed(5)}, {longitude.toFixed(5)}</p>
              <p><span className="text-gray-600">Radius:</span> {radius} km</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl mb-4">Map Preview</h2>
          {hasLocation ? (
            <MapView
              center={[latitude, longitude]}
              zoom={12}
              markers={[{ id: 1, lat: latitude, lng: longitude, label: 'Your Location', sublabel: `${radius} km radius`, icon: redIcon }]}
              circle={{ center: [latitude, longitude], radius }}
              height="400px"
            />
          ) : (
            <div className="bg-gray-200 rounded-lg h-[400px] flex items-center justify-center">
              <div className="text-center text-gray-600">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>Click "Use My Location" or enter coordinates to see the map</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
