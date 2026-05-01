interface AthleteCardProps {
  name: string;
  title: string;
  category: string;
  image: string;
  bio: string;
  achievements: string[];
}

export default function AthleteCard({
  name,
  title,
  category,
  image,
  bio,
  achievements,
}: AthleteCardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative w-full h-80 bg-brand-gray-100 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src =
              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23E5E7EB" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="20" fill="%236B7280" text-anchor="middle" dy=".3em"%3EFoto do Atleta%3C/text%3E%3C/svg%3E';
          }}
        />
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-black text-brand-black mb-1">{name}</h3>
        <p className="text-sm font-semibold text-brand-black mb-1">{title}</p>
        <p className="text-xs text-brand-gray-500 mb-4 font-medium uppercase tracking-widest">
          {category}
        </p>

        <p className="text-sm text-brand-gray-600 leading-relaxed mb-4">{bio}</p>

        {/* Achievements */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-brand-gray-700 uppercase tracking-widest mb-3">
            Conquistas
          </p>
          <ul className="space-y-2">
            {achievements.map((achievement, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-brand-gray-600">
                <span className="text-brand-black font-bold mt-1">•</span>
                <span>{achievement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
