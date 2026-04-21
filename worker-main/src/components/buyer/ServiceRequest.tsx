import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, DollarSign, CreditCard, Banknote } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { dbService } from '../../services/database.service';
import { PaymentMethod, WorkerProfile } from '../../types/database';

interface ServiceRequestProps {
  workerId: number;
  onBack: () => void;
  onSubmit: () => void;
}

export function ServiceRequest({ workerId, onBack, onSubmit }: ServiceRequestProps) {
  const [step, setStep] = useState(1);
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    service: '',
    description: '',
    date: '',
    time: '',
    location: '',
    estimatedHours: 2,
    paymentMethod: 'cash' as PaymentMethod,
  });

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        setLoading(true);
        const data = await dbService.getSellerById(workerId);
        setWorker(data);
      } catch (error) {
        console.error('Failed to fetch worker:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorker();
  }, [workerId]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleSubmitBooking = async () => {
    try {
      setSubmitting(true);
      setSubmitError('');
      const userId = localStorage.getItem('user_id');
      if (!userId || !worker) {
        setSubmitError('Missing user or worker data. Please re-open this request.');
        return;
      }

      let categoryId = worker.categories?.[0]?.id || worker.services?.[0]?.category_id;
      if (!categoryId) {
        const categories = await dbService.getCategories();
        categoryId = categories[0]?.id;
      }
      if (!categoryId) {
        setSubmitError('No service category available. Please contact support.');
        return;
      }

      await dbService.createBooking({
        buyer_id: parseInt(userId, 10),
        seller_id: worker.id,
        category_id: categoryId,
        title: formData.service || (worker.categories?.[0]?.name ?? 'Service Request'),
        description: formData.description,
        scheduled_date: formData.date ? (formData.date as any) : undefined,
        scheduled_time: formData.time || undefined,
        location_address: formData.location,
        estimated_hours: formData.estimatedHours,
        hourly_rate: worker.hourly_rate || 50,
        total_amount: (worker.hourly_rate || 50) * formData.estimatedHours,
        payment_method: formData.paymentMethod,
      });

      onSubmit();
    } catch (error) {
      console.error('Failed to create booking:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit request. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !worker) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  const displayWorker = {
    name: worker.user?.full_name || worker.business_name || 'Worker',
    service: worker.business_name || worker.categories?.[0]?.name || 'Service Provider',
    image:
      worker.user?.profile_image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    hourlyRate: worker.hourly_rate || 50,
  };

  const totalAmount = displayWorker.hourlyRate * formData.estimatedHours;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-r from-primary to-[#10B981] text-white p-6">
        <button
          onClick={onBack}
          className="mb-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold mb-1">Request Service</h1>
        <p className="text-white/90">Book {displayWorker.name}</p>

        <div className="flex items-center justify-center gap-2 mt-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all ${s <= step ? 'bg-white' : 'bg-white/30'}`}
            />
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6">
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <img src={displayWorker.image} alt={displayWorker.name} className="w-16 h-16 rounded-xl object-cover" />
            <div className="flex-1">
              <h3 className="font-semibold">{displayWorker.name}</h3>
              <p className="text-sm text-muted-foreground">{displayWorker.service}</p>
            </div>
            <div className="text-right">
              <div className="font-bold text-primary">LRs {displayWorker.hourlyRate}</div>
              <div className="text-xs text-muted-foreground">per hour</div>
            </div>
          </div>
        </Card>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
            <h2 className="text-xl font-semibold mb-4">Service Details</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Select Service</label>
              <select
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Choose a service...</option>
                <option value="installation">Electrical Installation</option>
                <option value="wiring">Wiring & Rewiring</option>
                <option value="repair">Circuit Breaker Repair</option>
                <option value="lighting">Lighting Installation</option>
                <option value="emergency">Emergency Service</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Describe the Job</label>
              <textarea
                className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px]"
                placeholder="Please describe what you need done..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
            <h2 className="text-xl font-semibold mb-4">When & Where</h2>

            <Input
              type="date"
              label="Preferred Date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              icon={<Calendar className="w-5 h-5" />}
            />

            <Input
              type="time"
              label="Preferred Time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              icon={<Clock className="w-5 h-5" />}
            />

            <Input
              label="Service Location"
              placeholder="Enter your address"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              icon={<MapPin className="w-5 h-5" />}
            />

            <Card className="bg-primary/5 border-primary/20">
              <p className="text-sm">
                Tip: Worker will confirm availability for your chosen date and time.
              </p>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
            <h2 className="text-xl font-semibold mb-4">Payment & Confirm</h2>

            <div>
              <label className="block text-sm font-medium mb-3">Payment Method</label>
              <div className="space-y-2">
                <button
                  onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center space-x-3 ${
                    formData.paymentMethod === 'cash'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <Banknote className="w-6 h-6 text-primary" />
                  <div className="text-left flex-1">
                    <div className="font-medium">Cash</div>
                    <div className="text-sm text-muted-foreground">Pay after service completion</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    formData.paymentMethod === 'cash' ? 'border-primary bg-primary' : 'border-border'
                  }`}>
                    {formData.paymentMethod === 'cash' && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setFormData({ ...formData, paymentMethod: 'card' })}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center space-x-3 ${
                    formData.paymentMethod === 'card'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-primary" />
                  <div className="text-left flex-1">
                    <div className="font-medium">Card Payment</div>
                    <div className="text-sm text-muted-foreground">Secure card payment via platform</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    formData.paymentMethod === 'card' ? 'border-primary bg-primary' : 'border-border'
                  }`}>
                    {formData.paymentMethod === 'card' && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>

            <Card>
              <h3 className="font-semibold mb-3">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{formData.service || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Time</span>
                  <span className="font-medium">{formData.date || 'N/A'} at {formData.time || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium text-right">{formData.location || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-medium capitalize">{formData.paymentMethod}</span>
                </div>
                <div className="border-t border-border pt-2 mt-2 flex justify-between">
                  <span className="font-semibold">Estimated Rate</span>
                  <span className="font-bold text-primary text-lg">LRs {displayWorker.hourlyRate}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Hours</span>
                  <span className="font-medium">{formData.estimatedHours}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-bold text-primary text-lg">LRs {totalAmount}</span>
                </div>
              </div>
            </Card>

            <Card className="bg-accent/5 border-accent/20">
              <p className="text-sm">
                Final price will be determined after the worker assesses the job.
              </p>
            </Card>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <Button
            fullWidth
            onClick={step === 3 ? handleSubmitBooking : handleNext}
            disabled={submitting}
          >
            {step === 3 ? (submitting ? 'Submitting...' : 'Submit Request') : 'Next'}
          </Button>
        </div>

        {submitError && (
          <Card className="mt-4 border-destructive/30 bg-destructive/5">
            <p className="text-sm text-destructive">{submitError}</p>
          </Card>
        )}
      </div>
    </div>
  );
}



