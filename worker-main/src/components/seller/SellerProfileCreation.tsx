import React, { useState, useRef } from 'react';
import { Camera, MapPin, DollarSign, Clock, Languages, Award, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { dbService } from '../../services/database.service';

interface SellerProfileCreationProps {
  onComplete: (data: any) => void;
}

const SERVICE_CATEGORIES = [
  'Plumber', 'Electrician', 'Cleaner', 'Carpenter', 'Painter', 'Gardener',
  'Tutor', 'Designer', 'Technician', 'Mechanic', 'Chef', 'Photographer'
];

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Expert'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Arabic'];

export function SellerProfileCreation({ onComplete }: SellerProfileCreationProps) {
  const [step, setStep] = useState(1);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const docsInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    serviceTitle: '',
    bio: '',
    categories: [] as string[],
    skillLevel: '',
    experience: '',
    languages: [] as string[],
    hourlyRate: '',
    workingRadius: 10,
    availability: '',
    emergencyService: false,
    location: '',
  });
  
  const progress = (step / 4) * 100;
  
  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    const submitProfile = async () => {
      try {
        setSubmitting(true);
        setError('');
        const userId = localStorage.getItem('user_id');
        if (!userId) throw new Error('Missing user id');

        if (formData.fullName) {
          await dbService.updateUser(parseInt(userId), { full_name: formData.fullName });
        }

        const sellerProfile = await dbService.createSellerProfile({
          business_name: formData.serviceTitle,
          bio: formData.bio,
          hourly_rate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
          skill_level: formData.skillLevel,
          years_experience: formData.experience ? parseInt(formData.experience) : undefined,
          address: formData.location,
          latitude: coords?.lat,
          longitude: coords?.lng,
          service_radius_km: formData.workingRadius,
          categories: formData.categories,
          languages: formData.languages,
          service_title: formData.serviceTitle,
          service_description: formData.bio,
        });

        if (photoFile) {
          await dbService.uploadProfileImage(parseInt(userId), photoFile);
        }

        if (docFiles.length > 0) {
          await dbService.uploadSellerCertifications(sellerProfile.id, docFiles);
        }

        onComplete({ ...formData, sellerProfileId: sellerProfile.id });
      } catch (err) {
        setError('Failed to save profile. Please try again.');
        console.error('Profile creation error:', err);
      } finally {
        setSubmitting(false);
      }
    };

    submitProfile();
  };
  
  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };
  
  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-r from-primary to-[#10B981] text-white p-6">
        <h2 className="text-2xl font-bold mb-4">Create Your Profile</h2>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm mt-2 opacity-90">Step {step} of 4</p>
      </div>
      
      <div className="max-w-2xl mx-auto px-6 py-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center">
              <div className="w-24 h-24 bg-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                <Camera className="w-10 h-10 text-muted-foreground" />
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPhotoFile(file);
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => photoInputRef.current?.click()}
              >
                {photoFile ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {photoFile && (
                <p className="text-xs text-muted-foreground mt-2">{photoFile.name}</p>
              )}
            </div>
            
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
            
            <Input
              label="Service Title"
              placeholder="e.g., Professional Electrician"
              value={formData.serviceTitle}
              onChange={(e) => setFormData({ ...formData, serviceTitle: e.target.value })}
            />
            
            <div>
              <label className="block text-sm font-medium mb-1.5">Bio / About</label>
              <textarea
                className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-h-[100px]"
                placeholder="Tell buyers about your experience and skills..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div>
              <label className="block text-sm font-medium mb-3">Service Categories</label>
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`py-2 px-4 rounded-lg border-2 transition-all ${
                      formData.categories.includes(category)
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
              <label className="block text-sm font-medium mb-3">Skill Level</label>
              <div className="flex gap-2">
                {SKILL_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setFormData({ ...formData, skillLevel: level })}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                      formData.skillLevel === level
                        ? 'border-primary bg-primary text-white'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            
            <Input
              label="Years of Experience"
              type="number"
              placeholder="5"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              icon={<Award className="w-5 h-5" />}
            />
            
            <div>
              <label className="block text-sm font-medium mb-3">Languages Spoken</label>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((language) => (
                  <button
                    key={language}
                    onClick={() => toggleLanguage(language)}
                    className={`py-2 px-4 rounded-lg border-2 transition-all ${
                      formData.languages.includes(language)
                        ? 'border-primary bg-primary text-white'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <Input
              label="Hourly Rate (LRs)"
              type="number"
              placeholder="50"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
              icon={<DollarSign className="w-5 h-5" />}
            />
            
            <div>
              <label className="block text-sm font-medium mb-3">
                Working Radius: {formData.workingRadius} km
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={formData.workingRadius}
                onChange={(e) => setFormData({ ...formData, workingRadius: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>
            
            <Input
              label="Availability"
              placeholder="Mon-Fri, 9AM-5PM"
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              icon={<Clock className="w-5 h-5" />}
            />
            
            <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div>
                <h4 className="font-medium">Emergency Service</h4>
                <p className="text-sm text-muted-foreground">Available for urgent requests</p>
              </div>
              <button
                onClick={() => setFormData({ ...formData, emergencyService: !formData.emergencyService })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  formData.emergencyService ? 'bg-primary' : 'bg-switch-background'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                    formData.emergencyService ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
        
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <Input
              label="Location"
              placeholder="Enter your city or address"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              icon={<MapPin className="w-5 h-5" />}
            />

            <div>
              <Button
                variant="outline"
                onClick={() => {
                  if (!navigator.geolocation) {
                    setLocationError('Geolocation is not supported by your browser.');
                    return;
                  }
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                      setLocationError('');
                      setFormData({ ...formData, location: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}` });
                    },
                    () => setLocationError('Location permission denied.'),
                    { enableHighAccuracy: true, timeout: 10000 }
                  );
                }}
              >
                Use Current Location
              </Button>
              {coords && (
                <p className="text-xs text-muted-foreground mt-2">
                  Saved coordinates: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </p>
              )}
              {locationError && (
                <p className="text-xs text-destructive mt-2">{locationError}</p>
              )}
            </div>
            
            <Card>
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h4 className="font-medium mb-2">Upload Documents</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  ID, certificates, or licenses (optional)
                </p>
                <input
                  ref={docsInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    setDocFiles(files);
                  }}
                />
                <Button variant="outline" onClick={() => docsInputRef.current?.click()}>
                  {docFiles.length > 0 ? 'Change Files' : 'Choose Files'}
                </Button>
                {docFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {docFiles.length} file(s) selected
                  </p>
                )}
              </div>
            </Card>
            
            <Card className="bg-primary/5 border-primary/20">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Ready to start!</h4>
                  <p className="text-sm text-muted-foreground">
                    Your profile will be reviewed within 24 hours. You'll be notified once approved.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <Button fullWidth onClick={handleNext} disabled={submitting}>
            {submitting ? 'Saving...' : (step === 4 ? 'Complete Profile' : 'Next')}
          </Button>
        </div>
      </div>
    </div>
  );
}



