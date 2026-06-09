import StarRating from '@/components/ui/StarRating';

interface ReviewCardProps {
  name: string;
  title: string;
  rating: number;
  text: string;
}

export default function ReviewCard({ name, title, rating, text }: ReviewCardProps) {
  return (
    <div className="bg-white border border-brand-gray-200 px-6 py-5 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-sm text-brand-black">{name}</p>
          <p className="text-xs text-brand-gray-500 mt-0.5">{title}</p>
        </div>
        <StarRating rating={rating} />
      </div>
      <p className="text-sm text-brand-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}
