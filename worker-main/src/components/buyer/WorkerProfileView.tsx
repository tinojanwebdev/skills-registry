import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, MapPin, CheckCircle, MessageCircle, Heart, Share2, Award, Languages, Clock, DollarSign } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Modal } from '../ui/Modal';
import { dbService } from '../../services/database.service';
import { Review, SellerPost, WorkerProfile } from '../../types/database';

interface WorkerProfileViewProps {
  workerId: number;
  onBack: () => void;
  onRequestService: () => void;
  onMessage: (worker: WorkerProfile) => Promise<void>;
}

export function WorkerProfileView({ workerId, onBack, onRequestService, onMessage }: WorkerProfileViewProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [posts, setPosts] = useState<SellerPost[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);
  
  useEffect(() => {
    dbService.incrementSellerProfileView(workerId).catch((error) => {
      console.error('Failed to track profile view:', error);
    });
  }, [workerId]);

  useEffect(() => {
    const fetchWorkerProfile = async () => {
      try {
        setLoading(true);
        const data = await dbService.getSellerById(workerId);
        setWorker(data);
        const sellerPosts = await dbService.getSellerPosts(workerId);
        setPosts(sellerPosts);
        const sellerReviews = await dbService.getSellerReviews(workerId);
        setReviews(sellerReviews);
      } catch (error) {
        console.error('Failed to fetch worker profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkerProfile();
  }, [workerId]);
  
  if (loading || !worker) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }
  
  // Transform data for display
  const displayWorker = {
    id: worker.id,
    name: worker.user?.full_name || worker.business_name || 'Worker',
    service: worker.business_name || worker.categories?.[0]?.name || 'Service Provider',
    image: worker.user?.profile_image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    rating: worker.rating,
    reviews: worker.total_reviews,
    distance: '1.2 km away', // Would be calculated from user location
    hourlyRate: worker.hourly_rate || 50,
    skillLevel: worker.skill_level,
    experience: `${worker.years_experience || 0} years`,
    languages: worker.languages || ['English'],
    verified: worker.verified,
    bio: worker.bio || 'Professional service provider',
    services: worker.services?.map(s => s.service_title) || [],
    availability: 'Mon-Fri: 8AM-6PM, Weekends: On Request',
    responseTime: 'Usually responds within 1 hour',
    completedJobs: worker.total_jobs,
    portfolio: worker.portfolio?.map(p => p.image_url) || [],
    posts,
    recentReviews: reviews.slice(0, 3).map((review: any) => ({
      id: review.id,
      author: review.reviewer_name || 'Customer',
      rating: review.rating,
      comment: review.comment || 'No comment provided.',
      date: review.created_at ? new Date(review.created_at).toLocaleDateString() : '',
    })),
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header with background image */}
      <div className="relative h-64 bg-gradient-to-br from-primary to-[#10B981]">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors z-10"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-4 right-14 p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors z-10"
        >
          <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
        
        <button className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors z-10">
          <Share2 className="w-6 h-6" />
        </button>
      </div>
      
      {/* Profile card overlapping header */}
      <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10">
        <Card className="shadow-xl">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative mx-auto md:mx-0">
              <img
                src={displayWorker.image}
                alt={displayWorker.name}
                className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
              {displayWorker.verified && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#10B981] rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold mb-1">{displayWorker.name}</h1>
              <p className="text-lg text-muted-foreground mb-3">{displayWorker.service}</p>
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-4">
                <div className="flex items-center text-accent">
                  <Star className="w-5 h-5 fill-accent mr-1" />
                  <span className="font-bold mr-1">{displayWorker.rating}</span>
                  <span className="text-muted-foreground">({displayWorker.reviews})</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-5 h-5 mr-1" />
                  {displayWorker.distance}
                </div>
                <div className="flex items-center text-primary font-semibold">
                  <DollarSign className="w-5 h-5 mr-1" />
                  LRs {displayWorker.hourlyRate}/hr
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {displayWorker.skillLevel}
                </span>
                {displayWorker.verified && (
                  <span className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] rounded-full text-sm font-medium">
                    Verified
                  </span>
                )}
                <span className="px-3 py-1 bg-secondary text-foreground rounded-full text-sm font-medium">
                  {displayWorker.completedJobs} jobs completed
                </span>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button variant="primary" size="lg" onClick={onRequestService}>
            Request Service
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={async () => {
              if (!worker) return;
              try {
                setStartingChat(true);
                await onMessage(worker);
              } finally {
                setStartingChat(false);
              }
            }}
            disabled={startingChat}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            {startingChat ? 'Opening...' : 'Message'}
          </Button>
        </div>
        
        {/* Details */}
        <div className="mt-6 space-y-6">
          {/* About */}
          <Card>
            <h3 className="font-semibold text-lg mb-3">About</h3>
            <p className="text-muted-foreground leading-relaxed">{displayWorker.bio}</p>
          </Card>
          
          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="flex items-start space-x-3">
                <Award className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-medium mb-1">Experience</h4>
                  <p className="text-sm text-muted-foreground">{displayWorker.experience}</p>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-start space-x-3">
                <Languages className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-medium mb-1">Languages</h4>
                  <p className="text-sm text-muted-foreground">{displayWorker.languages.join(', ')}</p>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-medium mb-1">Availability</h4>
                  <p className="text-sm text-muted-foreground">{displayWorker.availability}</p>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-start space-x-3">
                <MessageCircle className="w-5 h-5 text-primary mt-1" />
                <div>
                  <h4 className="font-medium mb-1">Response Time</h4>
                  <p className="text-sm text-muted-foreground">{displayWorker.responseTime}</p>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Services Offered */}
          <Card>
            <h3 className="font-semibold text-lg mb-3">Services Offered</h3>
            <div className="grid grid-cols-2 gap-2">
              {displayWorker.services.map((service) => (
                <div key={service} className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </Card>
          
          {/* Portfolio */}
          <Card>
            <h3 className="font-semibold text-lg mb-3">Portfolio</h3>
            {displayWorker.portfolio.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {displayWorker.portfolio.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Portfolio ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No portfolio images uploaded yet.</p>
            )}
          </Card>
          
          {/* Seller Posts */}
          <Card>
            <h3 className="font-semibold text-lg mb-3">Seller Posts</h3>
            {displayWorker.posts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {displayWorker.posts.map((post) => (
                  <div key={post.id} className="p-2 bg-secondary rounded-md h-full flex flex-col">
                    <div className="w-full h-20 mb-1.5 rounded overflow-hidden bg-muted flex items-center justify-center">
                      {post.image_url ? (
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">No image</span>
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-2 flex-1">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium mb-0.5 line-clamp-1">{post.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                          {post.description || 'No description'}
                        </p>
                      </div>
                      <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary capitalize whitespace-nowrap self-start">
                        {post.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No posts published yet.</p>
            )}
          </Card>
          
          {/* Reviews */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Reviews ({displayWorker.reviews})</h3>
              <div className="flex items-center">
                <Star className="w-5 h-5 fill-accent text-accent mr-1" />
                <span className="font-bold">{displayWorker.rating}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {displayWorker.recentReviews.map((review) => (
                <div key={review.id} className="pb-4 border-b border-border last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{review.author}</span>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <div className="flex items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating ? 'fill-accent text-accent' : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              fullWidth
              className="mt-4"
              onClick={() => setShowAllReviews(true)}
            >
              View All Reviews
            </Button>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showAllReviews}
        onClose={() => setShowAllReviews(false)}
        title={`All Reviews (${displayWorker.reviews})`}
        size="lg"
      >
        <div className="p-6 space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review: any) => (
              <div key={review.id} className="pb-4 border-b border-border last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{review.reviewer_name || 'Customer'}</span>
                  <span className="text-xs text-muted-foreground">
                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
                <div className="flex items-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating ? 'fill-accent text-accent' : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{review.comment || 'No comment provided.'}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}


