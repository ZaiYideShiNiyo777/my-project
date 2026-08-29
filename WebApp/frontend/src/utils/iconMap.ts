import {
  Briefcase,
  Building2,
  Cpu,
  Factory,
  Gamepad2,
  Globe,
  GraduationCap,
  HeartPulse,
  Landmark,
  Leaf,
  Newspaper,
  Scale,
  ShoppingBag,
  Truck,
  type LucideIcon,
} from "lucide-vue-next";

/** 分类 icon_name -> lucide 图标组件（与后端 seed 的 icon_name 对应） */
const iconMap: Record<string, LucideIcon> = {
  Cpu,
  Landmark,
  HeartPulse,
  GraduationCap,
  Factory,
  ShoppingBag,
  Leaf,
  Truck,
  Building2,
  Scale,
  Briefcase,
  Globe,
  Gamepad2,
  Newspaper,
};

/** 取分类图标，未知或缺失时回退地球图标 */
export function getCategoryIcon(name?: string | null): LucideIcon {
  return (name && iconMap[name]) || Globe;
}
