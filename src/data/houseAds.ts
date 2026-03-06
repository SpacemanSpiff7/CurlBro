import type { HouseAdCategory } from '../config/ads';

export interface HouseAd {
  id: string;
  category: HouseAdCategory;
  label: string;        // "CURLBRO TIP" or "BUILT BY"
  headline: string;
  body: string;
  cta?: string;         // Optional button text
  href?: string;        // Optional link
  accentColor: string;  // Tailwind border-l-* class
}

export const HOUSE_ADS: HouseAd[] = [
  // Form Tips (8) — cyan accent
  { id: 'ft1', category: 'form_tip', label: 'CURLBRO TIP', headline: 'Control the Eccentric', body: 'Slow down the lowering phase to 2-3 seconds. Eccentric control builds more muscle and reduces injury risk.', accentColor: 'border-l-cyan-500' },
  { id: 'ft2', category: 'form_tip', label: 'CURLBRO TIP', headline: 'Full Range of Motion', body: 'Partial reps leave gains on the table. Use the fullest ROM you can control — research shows it maximizes hypertrophy.', accentColor: 'border-l-cyan-500' },
  { id: 'ft3', category: 'form_tip', label: 'CURLBRO TIP', headline: 'Brace Your Core', body: 'Take a deep breath and brace your abs before every heavy lift. A stable core protects your spine and lets you lift more.', accentColor: 'border-l-cyan-500' },
  { id: 'ft4', category: 'form_tip', label: 'CURLBRO TIP', headline: 'Mind-Muscle Connection', body: 'Focus on the target muscle during each rep. Studies show intentional focus increases muscle activation by up to 20%.', accentColor: 'border-l-cyan-500' },
  { id: 'ft5', category: 'form_tip', label: 'CURLBRO TIP', headline: 'Don\'t Ego Lift', body: 'If you can\'t control the weight through the full range of motion, it\'s too heavy. Drop the weight, build the muscle.', accentColor: 'border-l-cyan-500' },
  { id: 'ft6', category: 'form_tip', label: 'CURLBRO TIP', headline: 'Warm Up Properly', body: 'Start with 1-2 light sets before working sets. Warm muscles generate more force and are less prone to injury.', accentColor: 'border-l-cyan-500' },
  { id: 'ft7', category: 'form_tip', label: 'CURLBRO TIP', headline: 'Retract Your Scapulae', body: 'On bench press and rows, pull your shoulder blades back and down. This protects your shoulders and improves pressing power.', accentColor: 'border-l-cyan-500' },
  { id: 'ft8', category: 'form_tip', label: 'CURLBRO TIP', headline: 'Grip Width Matters', body: 'Wider grip emphasizes chest on bench press, narrower grip shifts load to triceps. Experiment to find your strongest position.', accentColor: 'border-l-cyan-500' },

  // Recovery (5) — green accent
  { id: 'rc1', category: 'recovery', label: 'CURLBRO TIP', headline: 'Sleep Is Gains', body: 'Aim for 7-9 hours of quality sleep. Growth hormone peaks during deep sleep — it\'s when your muscles actually rebuild.', accentColor: 'border-l-green-500' },
  { id: 'rc2', category: 'recovery', label: 'CURLBRO TIP', headline: 'Hydrate for Performance', body: 'Even 2% dehydration reduces strength and endurance. Drink water consistently throughout the day, not just during workouts.', accentColor: 'border-l-green-500' },
  { id: 'rc3', category: 'recovery', label: 'CURLBRO TIP', headline: 'Rest Days Build Muscle', body: 'Muscles grow during recovery, not during training. Schedule 1-2 rest days per week for optimal adaptation.', accentColor: 'border-l-green-500' },
  { id: 'rc4', category: 'recovery', label: 'CURLBRO TIP', headline: 'Stretch After Training', body: 'Post-workout static stretching improves flexibility and may reduce next-day soreness. Hold each stretch for 30+ seconds.', accentColor: 'border-l-green-500' },
  { id: 'rc5', category: 'recovery', label: 'CURLBRO TIP', headline: 'Manage Your Stress', body: 'Chronic stress raises cortisol, which impairs recovery and muscle growth. Find time to decompress — your gains depend on it.', accentColor: 'border-l-green-500' },

  // Challenges (4) — amber accent
  { id: 'ch1', category: 'challenge', label: 'CURLBRO TIP', headline: 'Try a New Exercise', body: 'Variety prevents plateaus. Swap one exercise per workout for something new — CurlBro has 201 exercises to explore.', accentColor: 'border-l-amber-500' },
  { id: 'ch2', category: 'challenge', label: 'CURLBRO TIP', headline: 'Track Your Progress', body: 'Log every workout. Progressive overload is the #1 driver of muscle growth — you can\'t improve what you don\'t measure.', accentColor: 'border-l-amber-500' },
  { id: 'ch3', category: 'challenge', label: 'CURLBRO TIP', headline: 'Superset Challenge', body: 'Pair opposing muscle groups (chest/back, biceps/triceps) for supersets. You\'ll save time and increase training density.', accentColor: 'border-l-amber-500' },
  { id: 'ch4', category: 'challenge', label: 'CURLBRO TIP', headline: 'Add a Finisher', body: 'End your workout with a high-rep burnout set. Drop sets, rest-pause, or AMRAP — push your limits safely.', accentColor: 'border-l-amber-500' },

  // Nutrition (4) — violet accent
  { id: 'nu1', category: 'nutrition', label: 'CURLBRO TIP', headline: 'Protein Timing', body: 'Aim for 20-40g protein within 2 hours of training. The "anabolic window" is wider than you think, but consistency matters.', accentColor: 'border-l-violet-500' },
  { id: 'nu2', category: 'nutrition', label: 'CURLBRO TIP', headline: 'Eat Enough Protein', body: 'Target 1.6-2.2g protein per kg bodyweight daily. This is the single most important nutritional factor for muscle growth.', accentColor: 'border-l-violet-500' },
  { id: 'nu3', category: 'nutrition', label: 'CURLBRO TIP', headline: 'Creatine Works', body: 'Creatine monohydrate is the most studied and effective supplement. 3-5g daily improves strength, power, and muscle growth.', accentColor: 'border-l-violet-500' },
  { id: 'nu4', category: 'nutrition', label: 'CURLBRO TIP', headline: 'Don\'t Fear Carbs', body: 'Carbs fuel intense training. Eat them around workouts for energy and recovery — they don\'t make you fat, excess calories do.', accentColor: 'border-l-violet-500' },

  // General (3) — zinc accent
  { id: 'gn1', category: 'general', label: 'CURLBRO TIP', headline: 'Progressive Overload', body: 'Gradually increase weight, reps, or sets over time. Your body adapts — keep challenging it to keep growing.', accentColor: 'border-l-zinc-400' },
  { id: 'gn2', category: 'general', label: 'CURLBRO TIP', headline: 'Consistency Beats Perfection', body: 'The best program is the one you stick to. Three solid workouts per week beats six inconsistent ones.', accentColor: 'border-l-zinc-400' },
  { id: 'gn3', category: 'general', label: 'CURLBRO TIP', headline: 'Train Smart, Not Just Hard', body: 'Effort matters, but so does technique. Quality reps with proper form will always beat sloppy heavy lifting.', accentColor: 'border-l-zinc-400' },
];
