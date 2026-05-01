import ReviewCard from './ReviewCard';
import reviews from '@/data/reviews.json';

export default function SocialProof() {
  const topReviews = reviews.reviews.slice(0, 3);

  return (
    <section className="py-20 sm:py-28 bg-white border-t border-b border-brand-gray-200">
      <div className="container-site">
        {/* Header - Centralizado */}
        <div className="text-center mb-16">
          
          <h2 className="text-3xl sm:text-4xl font-black text-brand-black mb-6">
            O que nossos clientes dizem
          </h2>
        </div>

        {/* Stats row - Centralizado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 mb-20">
          <div className="text-center">
            <p className="text-4xl sm:text-5xl font-black text-brand-black mb-2">+12.000</p>
            <p className="text-sm text-brand-gray-600">JiuJiteiros felizes</p>
          </div>
          <div className="text-center">
            <p className="text-4xl sm:text-5xl font-black text-brand-black mb-2">5 ⭐</p>
            <p className="text-sm text-brand-gray-600">Avaliações verificadas</p>
          </div>
          <div className="text-center">
            <p className="text-4xl sm:text-5xl font-black text-brand-black mb-2">Alto Padrão</p>
            <p className="text-sm text-brand-gray-600">Do design ao tatame</p>
          </div>
          
        </div>

        {/* Reviews - Centralizado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {topReviews.map((review) => (
            <ReviewCard key={review.id} {...review} />
          ))}
        </div>
      </div>
    </section>
  );
}
