import {
  Book,
  Dumbbell,
  Droplets,
  Brain,
  Pencil,
  Heart,
  Target,
  Leaf,
  Moon,
  Music,
  Bike,
  Apple,
  Coffee,
  Sun,
  Footprints,
  Timer,
  type LucideProps,
} from 'lucide-react';
import type { HabitIconName } from '@/lib/habits';

const iconMap: Record<HabitIconName, React.FC<LucideProps>> = {
  Book,
  Dumbbell,
  Droplets,
  Brain,
  Pencil,
  Heart,
  Target,
  Leaf,
  Moon,
  Music,
  Bike,
  Apple,
  Coffee,
  Sun,
  Footprints,
  Timer,
};

interface HabitIconProps extends LucideProps {
  name: HabitIconName;
}

export function HabitIcon({ name, ...props }: HabitIconProps) {
  const Icon = iconMap[name] ?? Target;
  return <Icon {...props} />;
}
