import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Star, Filter, X, MessageSquare, Calendar, Navigation, Megaphone, ChevronDown, ChevronUp } from 'lucide-react';
import { api, SERVER_BASE } from '../../api';
import { LocationInput } from '../../components/LocationInput';
import { MapView, availableIcon, busyIcon, type MapMarker } from '../../components/MapView';

interface Provider {
  id: number; name: string; business_name: string; category: string; rating: number;
  hourly_rate: number; skill_level: string; availability: string; review_count: number;
  latitude: number; longitude: number; distance?: number; profile_image?: string;
}

interface Promotion {
  id: number; title: string; description: string; price: number;
  images: string | string[] | null; provider_name: string; provider_image: string | null;
  provider_business: string; provider_id: number; created_at: string;
}

const imgUrl = (src: string) => src.startsWith('http') ? src : `${SERVER_BASE}${src}`;

const parseImages = (images: string | string[] | null): string[] => {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  try { return JSON.parse(images); } catch { return []; }
};

export const SeekerMap = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [distance, setDistance] = useState(10);
  const [skillLevel, setSkillLevel] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [myLat, setMyLat] = useState(6.9271);
  const [myLng, setMyLng] = useState(79.8612);
  const [showAllPromos, setShowAllPromos] = useState(false);
  const [expandedProviderPromos, setExpandedProviderPromos] = useState<Record<number, boolean>>({});
  const providerRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);
  const [bookTitle, setBookTitle] = useState('');
  const [bookDesc, setBookDesc] = useState('');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookLocation, setBookLocation] = useState('');
  const [bookLoading, setBookLoading] = useState(false);

  useEffect(() => {
    api.get<any[]>('/categories').then(c => setCategories(c.map(x => x.name))).catch(() => {});
    api.get<Promotion[]>('/promotions/public').then(setPromotions).catch(() => {});
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setMyLat(pos.coords.latitude); setMyLng(pos.coords.longitude); },
        () => {}
      );
    }
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (skillLevel) params.set('skill_level', skillLevel);
    if (minRating) params.set('min_rating', String(minRating));
    params.set('lat', String(myLat));
    params.set('lng', String(myLng));
    params.set('distance', String(distance));
    try { setProviders(await api.get<Provider[]>(`/providers?${params}`)); } catch { /* empty */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchProviders(); }, [selectedCategory, skillLevel, minRating, distance, myLat, myLng]);

  // Filter promotions: only from providers currently shown
  const providerIds = new Set(providers.map(p => p.id));
  const filteredPromotions = promotions.filter(p => providerIds.has(p.provider_id));
  const visiblePromos = showAllPromos ? filteredPromotions : filteredPromotions.slice(0, 5);

  const resetFilters = () => { setSelectedCategory(''); setDistance(10); setSkillLevel(''); setMinRating(0); setCategorySearch(''); };

  const handleMessage = async (providerId: number) => {
    try {
      await api.post<any>('/conversations', { other_user_id: providerId });
      navigate('/seeker/inbox');
    } catch (err: any) {
      if (err.message?.includes('token') || err.message?.includes('unauthorized')) {
        alert('Session expired. Please log in again.'); navigate('/login');
      } else { alert('Failed to start conversation: ' + err.message); }
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingProvider) return;
    setBookLoading(true);
    try {
      await api.post('/jobs', {
        title: bookTitle, description: bookDesc, provider_id: bookingProvider.id,
        amount: bookingProvider.hourly_rate, scheduled_date: bookDate || null,
        scheduled_time: bookTime || null, location: bookLocation || 'Home Visit',
      });
      setBookingProvider(null);
      setBookTitle(''); setBookDesc(''); setBookDate(''); setBookTime(''); setBookLocation('');
      alert('Booking request sent successfully!');
    } catch { alert('Failed to create booking'); } finally { setBookLoading(false); }
  };

  const openBooking = (p: Provider) => { setBookingProvider(p); setBookTitle(`${p.business_name || p.name} Service`); };

  const scrollToProvider = (id: number) => {
    providerRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const toggleProviderPromos = (id: number) => {
    setExpandedProviderPromos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const mapMarkers: MapMarker[] = providers
    .filter(p => p.latitude && p.longitude)
    .map(p => ({
      id: p.id,
      lat: Number(p.latitude),
      lng: Number(p.longitude),
      label: p.name,
      sublabel: `${p.business_name} — LRs ${p.hourly_rate}/hr${p.distance !== undefined ? ` — ${Number(p.distance).toFixed(1)} km` : ''}`,
      icon: p.availability === 'available' ? availableIcon : busyIcon,
    }));

  const getProviderPromotions = (providerId: number) => promotions.filter(p => p.provider_id === providerId);

  const renderPromoCard = (promo: Promotion) => {
    const postImages = parseImages(promo.images);
    const provImg = promo.provider_image ? imgUrl(promo.provider_image) : null;
    return (
      <div key={promo.id} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-3">
          {provImg ? (
            <img src={provImg} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm">
              {promo.provider_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{promo.provider_name}</p>
            <p className="text-xs text-gray-500">{promo.provider_business} • {new Date(promo.created_at).toLocaleDateString()}</p>
          </div>
          <span className="text-sm text-indigo-600 font-medium shrink-0">LRs {promo.price}</span>
        </div>
        <h4 className="text-sm font-medium mb-1">{promo.title}</h4>
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{promo.description}</p>
        {postImages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {postImages.map((img, i) => (
              <img key={i} src={imgUrl(img)} alt="" className="w-28 h-20 rounded-lg object-cover shrink-0" />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-3xl mb-8">Find Services</h1>

      {/* Booking Modal */}
      {bookingProvider && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4" onClick={() => setBookingProvider(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl">Book {bookingProvider.name}</h2>
              <button onClick={() => setBookingProvider(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-gray-700">Service Title</label>
                <input type="text" value={bookTitle} onChange={e => setBookTitle(e.target.value)} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700">Description</label>
                <textarea value={bookDesc} onChange={e => setBookDesc(e.target.value)} rows={3} required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe what you need..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-700">Date</label>
                  <input type="date" value={bookDate} onChange={e => setBookDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700">Time</label>
                  <input type="time" value={bookTime} onChange={e => setBookTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700">Location</label>
                <LocationInput value={bookLocation} onChange={setBookLocation} placeholder="Search location or type address" />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <span className="text-gray-600">Rate:</span> <span className="text-blue-600 font-medium">LRs {bookingProvider.hourly_rate}/hr</span>
              </div>
              <button type="submit" disabled={bookLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                <Calendar className="w-5 h-5" />{bookLoading ? 'Sending...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {showFilters && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2"><Filter className="w-5 h-5 text-blue-600" /><h2 className="text-xl">Filters</h2></div>
                <button onClick={() => setShowFilters(false)} className="lg:hidden p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Service Category</label>
                  <input type="text" value={categorySearch} onChange={e => setCategorySearch(e.target.value)}
                    placeholder="Search category..." className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {categories.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase())).map((c) => (
                      <button key={c} onClick={() => setSelectedCategory(selectedCategory === c ? '' : c)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{c}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-3 text-gray-700">Distance: {distance} km</label>
                  <input type="range" min="1" max="50" value={distance} onChange={(e) => setDistance(parseInt(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm mb-3 text-gray-700">Skill Level</label>
                  <div className="space-y-2">
                    {['Beginner', 'Intermediate', 'Expert'].map((l) => (
                      <button key={l} onClick={() => setSkillLevel(skillLevel === l ? '' : l)}
                        className={`w-full px-4 py-2 rounded-lg text-sm transition-colors ${skillLevel === l ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-3 text-gray-700">Minimum Rating</label>
                  <div className="space-y-2">
                    {[{ label: '3+ ⭐', value: 3 }, { label: '4+ ⭐', value: 4 }, { label: '5+ ⭐', value: 5 }].map((r) => (
                      <button key={r.value} onClick={() => setMinRating(minRating === r.value ? 0 : r.value)}
                        className={`w-full px-4 py-2 rounded-lg text-sm transition-colors ${minRating === r.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{r.label}</button>
                    ))}
                  </div>
                </div>
                <div className="pt-4 space-y-2">
                  <button onClick={fetchProviders} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">Find Providers</button>
                  <button onClick={() => { resetFilters(); fetchProviders(); }} className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Reset</button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className={showFilters ? 'lg:col-span-2' : 'lg:col-span-3'}>
          {!showFilters && <button onClick={() => setShowFilters(true)} className="mb-4 bg-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2"><Filter className="w-5 h-5" />Show Filters</button>}

          {/* Map */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <MapView
              center={[myLat, myLng]}
              zoom={12}
              markers={mapMarkers}
              fitMarkers={mapMarkers.length > 0}
              height="400px"
              onMarkerClick={scrollToProvider}
            />
            <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
              <span>{providers.length} providers found</span>
              <button onClick={() => {
                navigator.geolocation?.getCurrentPosition(
                  (pos) => { setMyLat(pos.coords.latitude); setMyLng(pos.coords.longitude); },
                  () => alert('Unable to get location')
                );
              }} className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                <Navigation className="w-4 h-4" />My Location
              </button>
            </div>
          </div>

          {/* Promotions Feed */}
          {filteredPromotions.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl">Recent Promotions ({filteredPromotions.length})</h2>
                </div>
                {filteredPromotions.length > 5 && (
                  <button onClick={() => setShowAllPromos(!showAllPromos)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    {showAllPromos ? <><ChevronUp className="w-4 h-4" />Show Less</> : <><ChevronDown className="w-4 h-4" />Show All</>}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visiblePromos.map(renderPromoCard)}
              </div>
            </div>
          )}

          {/* Providers List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl">Available Providers ({providers.length})</h2>
            </div>
            <div className="max-h-[500px] overflow-y-auto space-y-4 pr-1">
            {loading ? <p className="text-center py-8 text-gray-500">Loading...</p> : providers.length > 0 ? providers.map((p) => {
              const provPromotions = getProviderPromotions(p.id);
              const isExpanded = expandedProviderPromos[p.id];
              const visibleProvPromos = isExpanded ? provPromotions : provPromotions.slice(0, 2);
              return (
              <div key={p.id} ref={el => { providerRefs.current[p.id] = el; }}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    {p.profile_image ? (
                      <img src={imgUrl(p.profile_image)} alt={p.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg sm:text-xl shrink-0">{p.name.charAt(0)}</div>
                    )}
                    <div>
                      <h3 className="text-lg mb-1">{p.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{p.business_name}</p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                        <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span>{Number(p.rating).toFixed(1)}</span><span className="text-gray-500">({p.review_count} reviews)</span></div>
                        {p.distance !== undefined && p.distance !== null && <span className="text-gray-500">• {Number(p.distance).toFixed(1)} km away</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xl sm:text-2xl text-blue-600 mb-1">LRs {p.hourly_rate}/hr</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs ${p.availability === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.availability}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  {p.category && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">{p.category}</span>}
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">{p.skill_level}</span>
                </div>

                {/* Provider Promotions */}
                {visibleProvPromos.length > 0 && (
                  <div className="mb-4 space-y-3">
                    {visibleProvPromos.map((promo) => {
                      const postImages = parseImages(promo.images);
                      return (
                        <div key={promo.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center gap-2 mb-2">
                            <Megaphone className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-medium">{promo.title}</span>
                            <span className="text-sm text-indigo-600 ml-auto">LRs {promo.price}</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{promo.description}</p>
                          {postImages.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto">
                              {postImages.map((img, i) => (
                                <img key={i} src={imgUrl(img)} alt="" className="w-24 h-18 rounded-lg object-cover shrink-0" />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {provPromotions.length > 2 && (
                      <button onClick={() => toggleProviderPromos(p.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        {isExpanded ? <><ChevronUp className="w-3 h-3" />Show Less</> : <><ChevronDown className="w-3 h-3" />Show All ({provPromotions.length})</>}
                      </button>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => openBooking(p)} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" />Book Now
                  </button>
                  <button onClick={() => handleMessage(p.id)} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" />Message
                  </button>
                </div>
              </div>
            );}) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
                <p className="mb-2">No providers found</p>
                <button onClick={() => { resetFilters(); fetchProviders(); }} className="text-blue-600 hover:text-blue-700">Reset filters</button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
