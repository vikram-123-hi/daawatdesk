const brands = [
  'La Pino\'z Pizza',
  'Star Biryani',
  'Jumbo King',
  'Hocco',
  'Yam Yam Cha',
  'TGI Friday\'s',
  'Giani\'s',
  'Yangkiez',
  'Kabhib',
  'Apsara',
  'Barcos',
  'Kailash Parbat',
]

export default function TrustedBy() {
  return (
    <section className="py-16 bg-white border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-text-light uppercase tracking-wider mb-8">
          Trusted by 1,00,000+ restaurants
        </p>
        <div className="relative overflow-hidden">
          <div className="flex animate-marquee">
            {[...brands, ...brands].map((brand, i) => (
              <div
                key={i}
                className="shrink-0 mx-6 lg:mx-10 flex items-center justify-center h-14 px-6 bg-surface rounded-xl"
              >
                <span className="text-base font-semibold text-text-secondary whitespace-nowrap">
                  {brand}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
