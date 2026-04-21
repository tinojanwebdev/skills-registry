import React, { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, MapPin, List } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/card';
import { BuyerMapView } from './BuyerMapView';
import { BuyerListView } from './BuyerListView';
import { dbService } from '../../services/database.service';
import { SellerPost, WorkerProfile } from '../../types/database';

interface BuyerHomeProps {
  onNavigate: (page: string) => void;
}

const DEFAULT_CENTER = { lat: 6.9271, lng: 79.8612 }; // Colombo fallback

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const isValidCoordinatePair = (lat: number | null, lng: number | null) =>
  lat !== null &&
  lng !== null &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceKm = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

export function BuyerHome({ onNavigate }: BuyerHomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [showFilters, setShowFilters] = useState(false);
  const [nearbyWorkers, setNearbyWorkers] = useState<WorkerProfile[]>([]);
  const [allWorkers, setAllWorkers] = useState<WorkerProfile[]>([]);
  const [postsBySeller, setPostsBySeller] = useState<Record<number, SellerPost[]>>({});
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapQueryCenter, setMapQueryCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [filters, setFilters] = useState({
    categories: [] as string[],
    distance: 10,
    priceRange: [0, 200],
    skillLevel: '',
    rating: 0,
    availability: '',
    languages: [] as string[],
  });
  
  const categories = [
    'Plumber', 'Electrician', 'Cleaner', 'Carpenter', 'Painter', 'Gardener',
    'Tutor', 'Designer', 'Technician', 'Mechanic', 'Chef', 'Photographer'
  ];
  
  // Fetch user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setUserLocation(DEFAULT_CENTER);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocationError('Location permission denied. Using fallback location.');
        setUserLocation(DEFAULT_CENTER);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (!mapQueryCenter && userLocation) {
      setMapQueryCenter(userLocation);
    }
  }, [mapQueryCenter, userLocation]);

  // Fetch all registered sellers immediately (for list tab)
  useEffect(() => {
    let isMounted = true;

    const fetchAllSellers = async () => {
      try {
        const allData = await dbService.getAllSellers();
        if (!isMounted) return;
        setAllWorkers(allData);
      } catch (error) {
        console.error('Failed to fetch all sellers:', error);
      }
    };

    fetchAllSellers();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch nearby workers + posts when map center changes (for map tab)
  useEffect(() => {
    if (!mapQueryCenter) return;

    let isMounted = true;

    const fetchNearbyWorkers = async () => {
      try {
        setLoading(true);

        const nearbyData = await dbService.getNearbySellers({
          latitude: mapQueryCenter.lat,
          longitude: mapQueryCenter.lng,
          radius: filters.distance || 50,
        });

        if (!isMounted) return;
        setNearbyWorkers(nearbyData);

        // Fallback if /sellers endpoint is unavailable
        setAllWorkers((prev) => (prev.length > 0 ? prev : nearbyData));

        const now = Date.now();
        const postsEntries = await Promise.all(
          nearbyData.map(async (seller) => {
            try {
              const sellerPosts = await dbService.getSellerPosts(seller.id);
              const activePosts = sellerPosts.filter((post) => {
                if (!post.expires_at) return true;
                return new Date(post.expires_at).getTime() > now;
              });
              return [seller.id, activePosts] as const;
            } catch {
              return [seller.id, []] as const;
            }
          })
        );

        if (!isMounted) return;
        setPostsBySeller(Object.fromEntries(postsEntries));
      } catch (error) {
        console.error('Failed to fetch nearby workers:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNearbyWorkers();

    return () => {
      isMounted = false;
    };
  }, [mapQueryCenter, filters.distance]);
  
  // Filter workers based on search query and filters
  const filteredWorkers = useMemo(() => {
    const sourceWorkers = viewMode === 'list' ? allWorkers : nearbyWorkers;

    return sourceWorkers.filter(worker => {
      // Search query filter - check name and service
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          worker.user?.full_name?.toLowerCase().includes(query) ||
          worker.business_name?.toLowerCase().includes(query) ||
          worker.bio?.toLowerCase().includes(query) ||
          worker.categories?.some(c => c.name.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Location text filter
      if (locationQuery.trim()) {
        const locationText = locationQuery.toLowerCase();
        const searchableLocation = [
          worker.address,
          worker.city,
          worker.state,
          worker.postal_code,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableLocation.includes(locationText)) return false;
      }
      
      // Category filter
      if (filters.categories.length > 0) {
        const hasCategory = worker.categories?.some(c => 
          filters.categories.some((selected) => selected.toLowerCase() === c.name.toLowerCase())
        );
        if (!hasCategory) return false;
      }
      
      // Distance filter applies only in map (nearby) mode.
      if (viewMode === 'map') {
        const rawDistance = toNumber((worker as any).distance);
        if (rawDistance !== null) {
          if (rawDistance > filters.distance) return false;
        } else if (mapQueryCenter) {
          const workerLat = toNumber(worker.latitude);
          const workerLng = toNumber(worker.longitude);
          if (isValidCoordinatePair(workerLat, workerLng)) {
            const calculated = distanceKm(mapQueryCenter, {
              lat: workerLat as number,
              lng: workerLng as number,
            });
            if (calculated > filters.distance) return false;
          }
        }
      }
      
      // Skill level filter
      if (
        filters.skillLevel &&
        (worker.skill_level || '').toLowerCase() !== filters.skillLevel.toLowerCase()
      ) {
        return false;
      }
      
      // Rating filter
      if (filters.rating > 0 && worker.rating < filters.rating) {
        return false;
      }
      
      return true;
    });
  }, [allWorkers, nearbyWorkers, searchQuery, locationQuery, filters, mapQueryCenter, viewMode]);
  
  // Transform workers to legacy format for map/list views
  const transformedWorkers = filteredWorkers.map((worker) => {
    const workerLat = toNumber(worker.latitude);
    const workerLng = toNumber(worker.longitude);
    const hasCoordinates = isValidCoordinatePair(workerLat, workerLng);
    const rawDistance = toNumber((worker as any).distance);

    return {
    id: worker.id,
    name: worker.user?.full_name || worker.business_name || 'Unknown',
    service: worker.business_name || worker.categories?.[0]?.name || 'Service Provider',
    image: worker.user?.profile_image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    rating: worker.rating,
    reviews: worker.total_reviews,
    distance: rawDistance !== null ? `${rawDistance.toFixed(1)} km` : 'Nearby',
    hourlyRate: worker.hourly_rate || 50,
    skillLevel: worker.skill_level,
    verified: worker.verified,
    lat: workerLat,
    lng: workerLng,
    hasCoordinates,
    category: worker.categories?.[0]?.name || 'General',
    latestPost: postsBySeller[worker.id]?.[0] || null,
  };
  });

  const mapWorkers = useMemo(
    () => transformedWorkers.filter((worker) => worker.hasCoordinates),
    [transformedWorkers]
  );

  const mapCenter = useMemo(() => {
    if (mapQueryCenter) return mapQueryCenter;
    if (userLocation) return userLocation;
    if (mapWorkers.length > 0) {
      return { lat: mapWorkers[0].lat as number, lng: mapWorkers[0].lng as number };
    }
    return DEFAULT_CENTER;
  }, [mapQueryCenter, userLocation, mapWorkers]);

  const nearbyPosts = useMemo(() => {
    const rows = nearbyWorkers.flatMap((worker) =>
      (postsBySeller[worker.id] || []).map((post) => ({
        ...post,
        workerId: worker.id,
        workerName: worker.user?.full_name || worker.business_name || 'Worker',
      }))
    );

    return rows
      .sort((a, b) => {
        const at = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bt - at;
      })
      .slice(0, 8);
  }, [nearbyWorkers, postsBySeller]);
  
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-[#10B981] text-white p-6 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Find Workers</h1>
          <div className="flex items-center text-white/90 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            {locationError ? 'Location unavailable' : 'Your area'}
          </div>
        </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="text-white hover:bg-white/10"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="relative mb-3">
            <Input
              placeholder="Search for services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
              className="bg-white"
            />
          </div>

          <div className="relative">
            <Input
              placeholder="Filter by location (city, area, postal code)"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              icon={<MapPin className="w-5 h-5" />}
              className="bg-white"
            />
          </div>
        </div>
      </div>
      
      {/* View Toggle */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center ${
                viewMode === 'map'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Map
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center ${
                viewMode === 'list'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredWorkers.length} {viewMode === 'list' ? 'registered sellers' : 'workers nearby'}
          </p>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-6xl mx-auto">
        {viewMode === 'map' ? (
          <>
          <BuyerMapView
            workers={mapWorkers}
            center={mapCenter}
            pinnedLocation={mapQueryCenter}
            onPinLocation={(coords) => setMapQueryCenter(coords)}
            onSelectWorker={(worker) => onNavigate(`worker-${worker.id}`)}
          />
            {nearbyPosts.length > 0 && (
              <div className="px-6 py-4">
                <h3 className="font-semibold text-lg mb-3">Nearby Worker Posts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {nearbyPosts.map((post) => (
                    <Card key={post.id} hover onClick={() => onNavigate(`worker-${post.workerId}`)}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">{post.workerName}</p>
                          <h4 className="font-medium">{post.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {post.description || 'No description'}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary capitalize">
                          {post.type}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <BuyerListView workers={transformedWorkers} onSelectWorker={(worker) => onNavigate(`worker-${worker.id}`)} />
        )}
      </div>
      
      {/* Filters Modal */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
        size="lg"
      >
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">Service Category</label>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setFilters({
                      ...filters,
                      categories: filters.categories.includes(category)
                        ? filters.categories.filter(c => c !== category)
                        : [...filters.categories, category]
                    });
                  }}
                  className={`py-2 px-4 rounded-lg border-2 transition-all ${
                    filters.categories.includes(category)
                      ? 'border-primary bg-primary text-white'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-3">
              Distance: {filters.distance} km
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={filters.distance}
              onChange={(e) => setFilters({ ...filters, distance: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 km</span>
              <span>50 km</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-3">Skill Level</label>
            <div className="flex gap-2">
              {['Beginner', 'Intermediate', 'Expert'].map((level) => (
                <button
                  key={level}
                  onClick={() => setFilters({ ...filters, skillLevel: filters.skillLevel === level ? '' : level })}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                    filters.skillLevel === level
                      ? 'border-primary bg-primary text-white'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-3">Minimum Rating</label>
            <div className="flex gap-2">
              {[3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFilters({ ...filters, rating: filters.rating === rating ? 0 : rating })}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                    filters.rating === rating
                      ? 'border-primary bg-primary text-white'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  {rating}+ ⭐
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setLocationQuery('');
                setFilters({
                  categories: [],
                  distance: 10,
                  priceRange: [0, 200],
                  skillLevel: '',
                  rating: 0,
                  availability: '',
                  languages: [],
                });
              }}
              fullWidth
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowFilters(false)}
              fullWidth
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}



