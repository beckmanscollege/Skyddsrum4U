import { motion, useScroll, useTransform } from 'motion/react';
import { SkyddsrumsSymbol } from './SkyddsrumsSymbol';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function ScrollingIntro() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="relative">
      {/* Hero */}
      <motion.div 
        style={{ opacity }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900"
      >
        <div className="text-center px-6">
          <SkyddsrumsSymbol size={200} className="mx-auto mb-12" />
          <h1 className="text-6xl md:text-8xl font-black text-gray-100 mb-6">
            Sveriges Skyddsrum
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            [Din text om skyddsrum här]
          </p>
        </div>
      </motion.div>

      {/* Content Section 1 */}
      <div className="min-h-screen bg-gray-900 flex items-center">
        <div className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1768751150683-6cfe35363185?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jcmV0ZSUyMGJ1bmtlciUyMGludGVyaW9yfGVufDF8fHx8MTc3MjUyOTM4M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Skyddsrum"
                className="w-full h-[400px] object-cover grayscale opacity-80"
              />
            </div>
            <div>
              <div className="w-12 h-1 bg-[#005AA0] mb-6" />
              <h2 className="text-4xl font-black text-gray-100 mb-6">
                [Rubrik här]
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed mb-4">
                [Din text om historia och bakgrund här. Ersätt med information om när skyddsrummen byggdes och varför.]
              </p>
              <p className="text-lg text-gray-400 leading-relaxed">
                [Fortsättning av texten här.]
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section 2 */}
      <div className="min-h-screen bg-gray-800 flex items-center">
        <div className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="w-12 h-1 bg-[#FF6B00] mb-6" />
              <h2 className="text-4xl font-black text-gray-100 mb-6">
                [Rubrik här]
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed mb-4">
                [Din text om kapacitet och funktion här. Berätta om hur många som får plats och var de finns.]
              </p>
              <p className="text-lg text-gray-400 leading-relaxed">
                [Fortsättning av texten här.]
              </p>
            </div>
            <div className="order-1 md:order-2">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1694666562332-51765ac3505d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbWVyZ2VuY3klMjBzaGVsdGVyJTIwdW5kZXJncm91bmR8ZW58MXx8fHwxNzcyNTI5MzgzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Skyddsrum"
                className="w-full h-[400px] object-cover grayscale opacity-80"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transition to stats */}
      <div className="h-screen bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <SkyddsrumsSymbol size={120} className="mx-auto mb-8 opacity-50" />
          <h2 className="text-5xl font-black text-gray-100 mb-4">
            Statistik
          </h2>
          <p className="text-xl text-gray-400">
            Skyddsrum i Stockholms län
          </p>
        </div>
      </div>
    </div>
  );
}
