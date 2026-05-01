interface ReviewCardProps {
  name: string;
  title: string;
  rating: number;
  text: string;
}

export default function ReviewCard({ name, title, rating, text }: ReviewCardProps) {
  return (
    <div className="bg-white border border-brand-gray-200 px-6 py-5 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-sm text-brand-black">{name}</p>
          <p className="text-xs text-brand-gray-500">{title}</p>
        </div>
        <div className="flex gap-1">
          {[...Array(rating)].map((_, i) => (
            <span key={i} className="text-lg">
              ⭐
            </span>
          ))}
        </div>
      </div>
      <p className="text-sm text-brand-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}
