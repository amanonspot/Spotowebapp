import { useState, useEffect } from 'react';

interface Review {
    id: string;
    reviewerName: string;
    reviewerLocation?: string;
    reviewerTenure: string;
    rating: number;
    reviewDate: string;
    tripType?: string;
    reviewText: string;
    profileImageUrl?: string;
    showMore?: boolean;
}

interface UseReviewsReturn {
  reviews: Review[];
  overallRating: number;
  totalReviews: number;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch reviews data dynamically
 * Note: This is a placeholder implementation since no reviews API was found in the Postman collection
 * You can replace this with actual API calls when the reviews endpoint is available
 */
export const useReviews = (eventId?: string): UseReviewsReturn => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [overallRating, setOverallRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!eventId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // TODO: Replace with actual API call when reviews endpoint is available
        // const data = await getReviews(eventId);
        
        // For now, return empty data to show "No reviews yet" message
        // This simulates a property with no reviews
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setReviews([]);
        setOverallRating(0);
        setTotalReviews(0);
        
        // Uncomment below to test with mock data
        /*
        const mockReviews: Review[] = [
          {
            id: "1",
            reviewerName: "Alexie",
            reviewerTenure: "2 years on Spoto",
            rating: 5,
            reviewDate: "4 days ago",
            tripType: "Group trip",
            reviewText: "The place was so peaceful and pretty view. Great experience!",
            showMore: false,
          },
          // ... more mock reviews
        ];
        
        setReviews(mockReviews);
        setOverallRating(4.8);
        setTotalReviews(mockReviews.length);
        */
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [eventId]);

  return { reviews, overallRating, totalReviews, loading, error };
};
