import {
  BookOpen,
  Bot,
  Camera,
  ChartNoAxesCombined,
  Cloud,
  Code,
  Cpu,
  Database,
  FileText,
  Folder,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  Key,
  LayoutGrid,
  Link,
  Lock,
  Mail,
  MessageCircle,
  Music,
  Newspaper,
  Palette,
  Rss,
  Search,
  Send,
  Server,
  Settings,
  Shield,
  Tags,
  Terminal,
  Video,
  Wrench,
  House,
  Star,
  Heart,
  Bookmark,
  Flag,
  Pin,
  Tag,
  Lightbulb,
  Plus,
  Minus,
  Check,
  X,
  RefreshCw,
  Download,
  Upload,
  ExternalLink,
  Braces,
  Brackets,
  CodeXml,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  Bug,
  Workflow,
  Network,
  Wifi,
  Router,
  Cable,
  HardDrive,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Keyboard,
  Mouse,
  Printer,
  Scan,
  QrCode,
  ClipboardList,
  ListChecks,
  NotebookPen,
  NotebookTabs,
  Files,
  FileCode,
  FileJson,
  FileArchive,
  FileSpreadsheet,
  FileSearch,
  FolderOpen,
  Github,
  Gitlab,
  Library,
  SquarePen,
  Languages,
  UserRound,
  Users,
  AudioLines,
  Headphones,
  Mic,
  Film,
  Clapperboard,
  Radio,
  Podcast,
  Youtube,
  Calendar,
  CalendarDays,
  Clock,
  Timer,
  AlarmClock,
  Bell,
  BellRing,
  Contact,
  ChartBar,
  ChartPie,
  ChartLine,
  Table,
  CircleDollarSign,
  CreditCard,
  Wallet,
  ShoppingCart,
  Briefcase,
  Building2,
  Store,
  Map,
  MapPin,
  Compass,
  Plane,
  Rocket,
  Sparkles,
  Zap,
  BrainCircuit,
  FlaskConical,
  Gamepad2,
  Puzzle,
  Component,
  Package,
  type LucideIcon
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getCategoryIcon } from "../article-helpers";
import {
  normalizeCategoryIcon,
  type CategoryIcon as CategoryIconValue,
  type CategoryIconName
} from "../category-icon-settings";

const icons: Record<CategoryIconName, LucideIcon> = {
  tags: Tags,
  folder: Folder,
  code: Code,
  terminal: Terminal,
  server: Server,
  database: Database,
  globe: Globe,
  cloud: Cloud,
  link: Link,
  "book-open": BookOpen,
  "file-text": FileText,
  newspaper: Newspaper,
  rss: Rss,
  mail: Mail,
  "message-circle": MessageCircle,
  send: Send,
  shield: Shield,
  lock: Lock,
  key: Key,
  search: Search,
  settings: Settings,
  wrench: Wrench,
  cpu: Cpu,
  bot: Bot,
  image: ImageIcon,
  camera: Camera,
  video: Video,
  music: Music,
  palette: Palette,
  "layout-grid": LayoutGrid,
  "chart-no-axes-combined": ChartNoAxesCombined,
  "graduation-cap": GraduationCap,
  house: House,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  flag: Flag,
  pin: Pin,
  tag: Tag,
  lightbulb: Lightbulb,
  plus: Plus,
  minus: Minus,
  check: Check,
  x: X,
  "refresh-cw": RefreshCw,
  download: Download,
  upload: Upload,
  "external-link": ExternalLink,
  braces: Braces,
  brackets: Brackets,
  "code-xml": CodeXml,
  "git-branch": GitBranch,
  "git-commit-horizontal": GitCommitHorizontal,
  "git-pull-request": GitPullRequest,
  bug: Bug,
  workflow: Workflow,
  network: Network,
  wifi: Wifi,
  router: Router,
  cable: Cable,
  "hard-drive": HardDrive,
  monitor: Monitor,
  smartphone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  keyboard: Keyboard,
  mouse: Mouse,
  printer: Printer,
  scan: Scan,
  "qr-code": QrCode,
  "clipboard-list": ClipboardList,
  "list-checks": ListChecks,
  "notebook-pen": NotebookPen,
  "notebook-tabs": NotebookTabs,
  files: Files,
  "file-code": FileCode,
  "file-json": FileJson,
  "file-archive": FileArchive,
  "file-spreadsheet": FileSpreadsheet,
  "file-search": FileSearch,
  "folder-open": FolderOpen,
  github: Github,
  gitlab: Gitlab,
  library: Library,
  "square-pen": SquarePen,
  languages: Languages,
  "user-round": UserRound,
  users: Users,
  "audio-lines": AudioLines,
  headphones: Headphones,
  mic: Mic,
  film: Film,
  clapperboard: Clapperboard,
  radio: Radio,
  podcast: Podcast,
  youtube: Youtube,
  calendar: Calendar,
  "calendar-days": CalendarDays,
  clock: Clock,
  timer: Timer,
  "alarm-clock": AlarmClock,
  bell: Bell,
  "bell-ring": BellRing,
  contact: Contact,
  "chart-bar": ChartBar,
  "chart-pie": ChartPie,
  "chart-line": ChartLine,
  table: Table,
  "circle-dollar-sign": CircleDollarSign,
  "credit-card": CreditCard,
  wallet: Wallet,
  "shopping-cart": ShoppingCart,
  briefcase: Briefcase,
  "building-2": Building2,
  store: Store,
  map: Map,
  "map-pin": MapPin,
  compass: Compass,
  plane: Plane,
  rocket: Rocket,
  sparkles: Sparkles,
  zap: Zap,
  "brain-circuit": BrainCircuit,
  "flask-conical": FlaskConical,
  "gamepad-2": Gamepad2,
  puzzle: Puzzle,
  component: Component,
  package: Package
};

export type CategoryIconImageStatus = "loading" | "loaded" | "error";

type ImageStatusCallback = (status: CategoryIconImageStatus, source: string) => void;

function CategoryImage({
  fallback: Fallback,
  onImageStatusChange,
  size,
  source,
  url,
  useThemeColor
}: {
  fallback: LucideIcon;
  onImageStatusChange?: ImageStatusCallback;
  size: number;
  source: string;
  url: string;
  useThemeColor: boolean;
}) {
  const [status, setStatus] = useState<CategoryIconImageStatus>("loading");

  useEffect(() => {
    onImageStatusChange?.(status, source);
  }, [onImageStatusChange, source, status]);

  return (
    <>
      {status !== "loaded" ? <Fallback size={size} /> : null}
      <img
        alt=""
        className={`category-icon-image${useThemeColor ? " is-current-color" : ""}`}
        decoding="async"
        height={size}
        onError={() => setStatus("error")}
        onLoad={() => setStatus("loaded")}
        referrerPolicy="no-referrer"
        src={url}
        style={{ visibility: status === "loaded" ? "visible" : "hidden" }}
        width={size}
      />
    </>
  );
}

export function CategoryIcon({
  category,
  icon,
  onImageStatusChange,
  size = 20
}: {
  category: string;
  icon?: CategoryIconValue;
  onImageStatusChange?: ImageStatusCallback;
  size?: number;
}) {
  const normalized = useMemo(() => normalizeCategoryIcon(icon), [icon?.type, icon?.value]);
  const Fallback = getCategoryIcon(category);
  const Icon = normalized?.type === "lucide" ? icons[normalized.value] : Fallback;
  const svgColors = normalized?.type === "svg"
    ? Array.from(normalized.value.matchAll(/\b(?:fill|stroke|color|stop-color)\s*=\s*(["'])(.*?)\1/gi),
      (match) => match[2].trim().toLowerCase())
    : [];
  const useThemeColor = svgColors.includes("currentcolor") &&
    svgColors.every((color) => color === "currentcolor" || color === "none");

  return (
    <span
      aria-hidden="true"
      className="category-icon"
      style={{ width: size, height: size }}
    >
      {normalized?.type === "image" || normalized?.type === "svg" ? (
        <CategoryImage
          fallback={Fallback}
          key={normalized.value}
          onImageStatusChange={onImageStatusChange}
          size={size}
          source={normalized.value}
          url={normalized.type === "svg"
            ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalized.value)}`
            : normalized.value}
          useThemeColor={useThemeColor}
        />
      ) : <Icon size={size} />}
    </span>
  );
}
