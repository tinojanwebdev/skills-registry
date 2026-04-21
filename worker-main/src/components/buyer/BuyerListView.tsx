import React from 'react';
import { MapPin, Star, CheckCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface BuyerListViewProps {
  workers: any[];
  onSelectWorker: (worker: any) => void;
}

export function BuyerListView({ workers, onSelectWorker }: BuyerListViewProps) {
  if (workers.length === 0) {
    return (
      <div className="px-6 py-6">
        <Card>
          <div className="py-10 text-center">
            <h3 className="text-lg font-semibold mb-2">No registered sellers found</h3>
            <p className="text-sm text-muted-foreground">
              Try changing your filters or search to see more results.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-4">
      {workers.map((worker) => (
        <Card key={worker.id} hover onClick={() => onSelectWorker(worker)}>
          <div className="flex gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={worker.image}
                alt={worker.name}
                className="w-24 h-24 rounded-xl object-cover"
              />
              {worker.verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#10B981] rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="font-semibold text-lg">{worker.name}</h3>
                  <p className="text-sm text-muted-foreground">{worker.service}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">LRs {worker.hourlyRate}</div>
                  <div className="text-xs text-muted-foreground">per hour</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-3 text-sm">
                <span className="flex items-center text-accent">
                  <Star className="w-4 h-4 fill-accent mr-1" />
                  {worker.rating}
                </span>
                <span className="text-muted-foreground">({worker.reviews} reviews)</span>
                <span className="flex items-center text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-1" />
                  {worker.distance}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">
                  {worker.skillLevel}
                </span>
                {worker.verified && (
                  <span className="px-2 py-1 text-xs rounded-full bg-[#10B981]/10 text-[#10B981] font-medium">
                    Verified
                  </span>
                )}
              </div>

              {worker.latestPost && (
                <div className="mb-3 p-2 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground mb-1">Nearby post</p>
                  <p className="text-sm font-medium line-clamp-1">{worker.latestPost.title}</p>
                </div>
              )}
              
              <Button variant="primary" size="sm" fullWidth>
                View Profile
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}


