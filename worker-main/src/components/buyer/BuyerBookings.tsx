import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, DollarSign, MessageCircle, Star, Briefcase } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Modal } from '../ui/Modal';
import { dbService } from '../../services/database.service';
import { BookingWithDetails } from '../../types/database';

interface BuyerBookingsProps {
  onNavigate: (page: string) => void;
}

export function BuyerBookings({ onNavigate }: BuyerBookingsProps) {
  const [filter, setFilter] = useState<'active' | 'past'>('active');
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewBooking, setReviewBooking] = useState<BookingWithDetails | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem('user_id');
        if (userId) {
          const data = await dbService.getBuyerBookings(parseInt(userId, 10));
          setBookings(data);
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleAcceptCompletion = async (bookingId: number) => {
    try {
      setError('');
      await dbService.updateBookingStatus(bookingId, 'completed');
      setBookings((prev) => {
        const updated = prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status: 'completed' } : booking
        );
        const completedBooking = updated.find((booking) => booking.id === bookingId) || null;
        if (completedBooking) {
          setReviewBooking(completedBooking);
          setReviewRating(5);
          setReviewComment('');
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to accept completion:', err);
      setError('Failed to accept completion. Please try again.');
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewBooking) return;
    try {
      setReviewSubmitting(true);
      setError('');

      const seller = await dbService.getSellerById(reviewBooking.seller_id);
      const revieweeId = seller.user_id;
      if (!revieweeId) {
        setError('Unable to find seller account for review.');
        return;
      }

      const createdReview = await dbService.createReview({
        booking_id: reviewBooking.id,
        reviewee_id: revieweeId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === reviewBooking.id ? { ...booking, review: createdReview } : booking
        )
      );
      setReviewBooking(null);
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const activeBookings = bookings.filter(
    (b) => b.status === 'pending' || b.status === 'accepted' || b.status === 'in_progress'
  );
  const pastBookings = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');
  const displayedBookings = filter === 'active' ? activeBookings : pastBookings;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'accepted':
      case 'in_progress':
        return 'bg-[#10B981]/10 text-[#10B981]';
      case 'completed':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-secondary text-foreground';
    }
  };

  const formatDate = (value?: Date) => {
    if (!value) return 'TBD';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'TBD' : date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-secondary pb-24">
      <div className="bg-gradient-to-r from-primary to-[#10B981] text-white p-6">
        <h1 className="text-2xl font-bold mb-1">My Bookings</h1>
        <p className="text-white/90">Track your service requests</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
              filter === 'active'
                ? 'bg-primary text-white shadow-md'
                : 'bg-card text-muted-foreground hover:bg-secondary'
            }`}
          >
            Active ({activeBookings.length})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
              filter === 'past'
                ? 'bg-primary text-white shadow-md'
                : 'bg-card text-muted-foreground hover:bg-secondary'
            }`}
          >
            Past ({pastBookings.length})
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading bookings...</div>
          ) : (
            displayedBookings.map((booking) => {
              const sellerName =
                booking.seller?.user?.full_name || booking.seller?.business_name || 'Worker';
              const sellerImage =
                booking.seller?.user?.profile_image ||
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400';
              const serviceName = booking.category?.name || booking.title || 'Service';
              const bookingDate = formatDate(booking.scheduled_date);
              const bookingTime = booking.scheduled_time || 'TBD';
              const bookingLocation = booking.location_address || 'Location not provided';
              const bookingPrice = booking.total_amount ?? 0;
              const paymentMethod = booking.payment_method || 'cash';
              const hasReview = !!booking.review;

              return (
                <Card key={booking.id}>
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={sellerImage}
                      alt={sellerName}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3 className="font-semibold">{sellerName}</h3>
                          <p className="text-sm text-muted-foreground">{serviceName}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(booking.status)}`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <Briefcase className="w-4 h-4 text-muted-foreground mr-2" />
                      <span>{booking.title || serviceName}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                      <span>{bookingDate}</span>
                      <Clock className="w-4 h-4 text-muted-foreground ml-4 mr-2" />
                      <span>{bookingTime}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mr-2" />
                      <span className="truncate">{bookingLocation}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground mr-2" />
                      <span className="font-semibold text-primary">LRs {bookingPrice}</span>
                      <span className="text-muted-foreground ml-2">({paymentMethod})</span>
                    </div>
                  </div>

                  {(booking.status === 'pending' ||
                    booking.status === 'accepted' ||
                    booking.status === 'in_progress') && (
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" fullWidth>
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Contact Worker
                      </Button>
                      <Button variant="outline" size="sm" fullWidth className="text-destructive">
                        Cancel
                      </Button>
                    </div>
                  )}

                  {booking.status === 'in_progress' && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm text-primary font-medium mb-2">
                        Seller requested completion approval.
                      </p>
                      <Button
                        variant="success"
                        size="sm"
                        fullWidth
                        onClick={() => handleAcceptCompletion(booking.id)}
                      >
                        Accept Completion
                      </Button>
                    </div>
                  )}

                  {booking.status === 'completed' && !hasReview && (
                    <div className="flex gap-2">
                      <Button
                        variant="accent"
                        size="sm"
                        fullWidth
                        onClick={() => {
                          setReviewBooking(booking);
                          setReviewRating(5);
                          setReviewComment('');
                        }}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Rate & Review
                      </Button>
                      <Button variant="primary" size="sm" fullWidth>
                        Rebook
                      </Button>
                    </div>
                  )}

                  {booking.status === 'completed' && hasReview && (
                    <div className="p-3 bg-[#10B981]/5 rounded-lg border border-[#10B981]/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#10B981]">
                          Completed & Rated ({booking.review?.rating} stars)
                        </span>
                        <Button variant="outline" size="sm">
                          Rebook
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {displayedBookings.length === 0 && !loading && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Bookings Found</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'active'
                ? "You don't have any active bookings"
                : "You don't have any past bookings"}
            </p>
            <Button variant="primary" onClick={() => onNavigate('home')}>
              Find Workers
            </Button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!reviewBooking}
        onClose={() => setReviewBooking(null)}
        title="Review Worker"
        size="md"
      >
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Rate your experience</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setReviewRating(value)}
                  className="p-1"
                >
                  <Star
                    className={`w-7 h-7 ${
                      value <= reviewRating ? 'fill-accent text-accent' : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Comment (optional)</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
              placeholder="Share your feedback..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" fullWidth onClick={() => setReviewBooking(null)}>
              Later
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleSubmitReview}
              disabled={reviewSubmitting}
            >
              {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


