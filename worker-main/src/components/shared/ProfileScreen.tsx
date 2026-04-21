import React, { useState, useEffect } from 'react';
import { User, Briefcase, Calendar, Star, Heart, Settings, LogOut, ChevronRight, MapPin } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { dbService } from '../../services/database.service';
import { User as UserType, SellerProfile } from '../../types/database';

interface ProfileScreenProps {
  role: 'buyer' | 'seller';
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface MenuItem {
  id: string;
  icon: any;
  label: string;
  badge?: string;
  route?: string;
}

export function ProfileScreen({ role, onNavigate, onLogout }: ProfileScreenProps) {
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [buyerLocationText, setBuyerLocationText] = useState('Detecting location...');
  const [buyerLocationPermission, setBuyerLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [serviceLatitude, setServiceLatitude] = useState('');
  const [serviceLongitude, setServiceLongitude] = useState('');
  const [serviceRadiusKm, setServiceRadiusKm] = useState(10);
  const [savingServiceArea, setSavingServiceArea] = useState(false);
  const [serviceAreaMessage, setServiceAreaMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem('user_id');
        if (userId) {
          const user = await dbService.getUser(parseInt(userId, 10));
          setUserProfile(user);

          if (role === 'seller') {
            const seller = await dbService.getSellerProfileByUser(parseInt(userId, 10));
            setSellerProfile(seller);
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [role]);

  useEffect(() => {
    if (role !== 'buyer') return;
    if (!navigator.geolocation) {
      setBuyerLocationText('Location not supported');
      return;
    }

    let permissionStatus: PermissionStatus | null = null;

    const resolvePermission = async () => {
      try {
        if (!('permissions' in navigator)) return;
        permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        setBuyerLocationPermission(permissionStatus.state);
        permissionStatus.onchange = () => {
          setBuyerLocationPermission(permissionStatus?.state || 'unknown');
        };
      } catch {
        setBuyerLocationPermission('unknown');
      }
    };

    const updateLocationText = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      setBuyerLocationText(
        `${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)`
      );
    };

    const handleLocationError = () => {
      setBuyerLocationText('Location permission denied');
    };

    const requestFreshLocation = () => {
      navigator.geolocation.getCurrentPosition(
        updateLocationText,
        handleLocationError,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    };

    resolvePermission();
    requestFreshLocation();

    const watchId = navigator.geolocation.watchPosition(
      updateLocationText,
      handleLocationError,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, [role]);

  useEffect(() => {
    if (role !== 'seller' || !sellerProfile) return;
    setServiceLatitude(
      sellerProfile.latitude !== undefined && sellerProfile.latitude !== null
        ? String(sellerProfile.latitude)
        : ''
    );
    setServiceLongitude(
      sellerProfile.longitude !== undefined && sellerProfile.longitude !== null
        ? String(sellerProfile.longitude)
        : ''
    );
    setServiceRadiusKm(
      sellerProfile.service_radius_km && Number.isFinite(Number(sellerProfile.service_radius_km))
        ? Number(sellerProfile.service_radius_km)
        : 10
    );
  }, [role, sellerProfile]);

  const handleUseCurrentLocationForService = () => {
    if (!navigator.geolocation) {
      setServiceAreaMessage('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setServiceLatitude(position.coords.latitude.toFixed(6));
        setServiceLongitude(position.coords.longitude.toFixed(6));
        setServiceAreaMessage('Current location detected. Save to update service area.');
      },
      () => {
        setServiceAreaMessage('Could not detect current location.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveServiceArea = async () => {
    if (!sellerProfile) return;

    const latitude = Number.parseFloat(serviceLatitude);
    const longitude = Number.parseFloat(serviceLongitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setServiceAreaMessage('Please enter a valid latitude between -90 and 90.');
      return;
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setServiceAreaMessage('Please enter a valid longitude between -180 and 180.');
      return;
    }

    try {
      setSavingServiceArea(true);
      setServiceAreaMessage('');

      try {
        await dbService.updateSellerProfile(sellerProfile.id, {
          latitude,
          longitude,
          service_radius_km: serviceRadiusKm,
        });
      } catch (primaryError) {
        // Backward-compatible fallback for servers that don't yet support service_radius_km.
        await dbService.updateSellerProfile(sellerProfile.id, {
          latitude,
          longitude,
        });
        console.warn('Saved service location without radius support:', primaryError);
        setServiceAreaMessage(
          'Location updated. Radius update is not supported by the current server yet.'
        );
      }

      const refreshedProfile = await dbService.getSellerProfileByUser(sellerProfile.user_id);
      setSellerProfile(refreshedProfile);
      setServiceAreaMessage((prev) =>
        prev || 'Service location and radius updated successfully.'
      );
    } catch (error) {
      console.error('Failed to update service area:', error);
      setServiceAreaMessage(
        `Failed to update service area: ${
          error instanceof Error ? error.message : 'Please try again.'
        }`
      );
    } finally {
      setSavingServiceArea(false);
    }
  };

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const buyerMenuItems: MenuItem[] = [
    { id: 'bookings', icon: Calendar, label: 'My Bookings', route: 'buyer-bookings' },
    { id: 'favorites', icon: Heart, label: 'Favorite Workers' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const sellerMenuItems: MenuItem[] = [
    { id: 'edit-profile', icon: User, label: 'Edit Profile', route: 'seller-profile' },
    { id: 'profile-views', icon: MapPin, label: 'Manage Profile Views', route: 'seller-dashboard' },
    {
      id: 'jobs',
      icon: Briefcase,
      label: 'Job History',
      badge: sellerProfile?.total_jobs ? sellerProfile.total_jobs.toString() : undefined,
      route: 'seller-jobs',
    },
    { id: 'reviews', icon: Star, label: 'Reviews & Ratings', route: 'seller-jobs' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const menuItems = role === 'buyer' ? buyerMenuItems : sellerMenuItems;
  const memberSince = new Date(userProfile.created_at);
  const memberSinceText = Number.isNaN(memberSince.getTime())
    ? 'Unknown'
    : memberSince.toDateString();

  return (
    <div className="min-h-screen bg-secondary pb-24">
      <div className="bg-gradient-to-r from-primary to-[#10B981] text-white p-6 pb-20">
        <h1 className="text-2xl font-bold mb-1">Profile</h1>
        <p className="text-white/90">{role === 'buyer' ? 'Manage your account' : 'Your worker profile'}</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-12">
        <Card className="shadow-xl mb-6">
          <div className="flex flex-col items-center text-center">
            <img
              src={userProfile.profile_image}
              alt={userProfile.full_name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg -mt-16 mb-4"
            />
            <h2 className="text-2xl font-bold mb-1">{userProfile.full_name}</h2>
            {sellerProfile?.business_name && (
              <p className="text-muted-foreground mb-2">{sellerProfile.business_name}</p>
            )}
            <p className="text-sm text-muted-foreground mb-1">{userProfile.email}</p>
            <p className="text-sm text-muted-foreground mb-4">{userProfile.phone}</p>

            {role === 'seller' ? (
              <div className="flex gap-6 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center text-accent mb-1">
                    <Star className="w-5 h-5 fill-accent mr-1" />
                    <span className="text-xl font-bold">{sellerProfile?.rating || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-primary mb-1">{sellerProfile?.total_jobs || 0}</div>
                  <p className="text-xs text-muted-foreground">Jobs</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-[#10B981] mb-1">LRs {(sellerProfile?.total_jobs || 0) * 60}</div>
                  <p className="text-xs text-muted-foreground">Earned</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-6 mb-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-primary mb-1">12</div>
                  <p className="text-xs text-muted-foreground">Bookings</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-accent mb-1">5</div>
                  <p className="text-xs text-muted-foreground">Favorites</p>
                </div>
              </div>
            )}

            {role === 'buyer' && (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>Current Location: {buyerLocationText}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Permission: {buyerLocationPermission}
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">Member since {memberSinceText}</p>
          </div>
        </Card>

        <div className="space-y-3 mb-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isNavigable = !!item.route;

            return (
              <Card
                key={item.id}
                hover={isNavigable}
                onClick={isNavigable ? () => onNavigate(item.route!) : undefined}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <span className="px-2 py-1 bg-primary text-white text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {role === 'seller' && sellerProfile && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Service Area</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <Input
                label="Latitude"
                type="number"
                step="0.000001"
                value={serviceLatitude}
                onChange={(e) => setServiceLatitude(e.target.value)}
                placeholder="6.927100"
              />
              <Input
                label="Longitude"
                type="number"
                step="0.000001"
                value={serviceLongitude}
                onChange={(e) => setServiceLongitude(e.target.value)}
                placeholder="79.861200"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Service Radius: {serviceRadiusKm} km
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={serviceRadiusKm}
                onChange={(e) => setServiceRadiusKm(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-2">
              <Button variant="outline" onClick={handleUseCurrentLocationForService}>
                Use Current Location
              </Button>
              <Button variant="primary" onClick={handleSaveServiceArea} disabled={savingServiceArea}>
                {savingServiceArea ? 'Saving...' : 'Save Service Area'}
              </Button>
            </div>

            {serviceAreaMessage && (
              <p className="text-sm text-muted-foreground mt-3">{serviceAreaMessage}</p>
            )}
          </Card>
        )}

        <Button
          variant="outline"
          fullWidth
          onClick={onLogout}
          className="text-destructive border-destructive hover:bg-destructive hover:text-white"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}



