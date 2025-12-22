/**
 * Centralized icon mapping for consistent icons across the application.
 * Use these icons instead of importing directly from lucide-react to ensure uniformity.
 */

import {
  // Navigation & Layout
  LayoutDashboard,
  Calendar,
  BookOpen,
  Users,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  
  // Actions
  Plus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Copy,
  Send,
  Eye,
  EyeOff,
  Check,
  CheckCircle,
  XCircle,
  
  // Status & Alerts
  AlertCircle,
  AlertTriangle,
  Info,
  Bell,
  BellOff,
  
  // Users & Authentication
  User,
  UserPlus,
  UserMinus,
  UserCheck,
  Users2,
  GraduationCap,
  Shield,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  
  // Files & Documents
  File,
  FileText,
  Folder,
  FolderOpen,
  Image,
  Paperclip,
  
  // Communication
  Mail,
  MessageSquare,
  MessageCircle,
  Phone,
  Video,
  
  // Time & Calendar
  Clock,
  CalendarDays,
  CalendarCheck,
  Timer,
  
  // Data & Analytics
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  
  // Education specific
  School,
  Presentation,
  ClipboardList,
  ClipboardCheck,
  Award,
  
  // Miscellaneous
  Building2,
  MapPin,
  Globe,
  Link,
  ExternalLink,
  QrCode,
  Printer,
  MoreHorizontal,
  MoreVertical,
  Loader2,
  type LucideIcon,
} from 'lucide-react';

// Standardized icon exports - use these for consistency
export const Icons = {
  // Navigation
  dashboard: LayoutDashboard,
  schedule: Calendar,
  formations: BookOpen,
  users: Users,
  settings: Settings,
  menu: Menu,
  close: X,
  back: ChevronLeft,
  forward: ChevronRight,
  expand: ChevronDown,
  collapse: ChevronUp,
  
  // Actions - Primary
  add: Plus,
  edit: Edit,
  delete: Trash2,
  save: Save,
  download: Download,
  upload: Upload,
  search: Search,
  filter: Filter,
  refresh: RefreshCw,
  copy: Copy,
  send: Send,
  view: Eye,
  hide: EyeOff,
  confirm: Check,
  success: CheckCircle,
  cancel: XCircle,
  
  // Status & Alerts
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  notification: Bell,
  notificationOff: BellOff,
  
  // Users
  user: User,
  userAdd: UserPlus,
  userRemove: UserMinus,
  userVerified: UserCheck,
  group: Users2,
  student: GraduationCap,
  admin: Shield,
  lock: Lock,
  unlock: Unlock,
  login: LogIn,
  logout: LogOut,
  
  // Files
  file: File,
  document: FileText,
  folder: Folder,
  folderOpen: FolderOpen,
  image: Image,
  attachment: Paperclip,
  
  // Communication
  email: Mail,
  message: MessageSquare,
  chat: MessageCircle,
  phone: Phone,
  video: Video,
  
  // Time
  clock: Clock,
  calendar: CalendarDays,
  calendarCheck: CalendarCheck,
  timer: Timer,
  
  // Analytics
  chart: BarChart3,
  up: TrendingUp,
  down: TrendingDown,
  pie: PieChart,
  
  // Education
  school: School,
  presentation: Presentation,
  attendance: ClipboardList,
  attendanceCheck: ClipboardCheck,
  award: Award,
  
  // Other
  building: Building2,
  location: MapPin,
  web: Globe,
  link: Link,
  external: ExternalLink,
  qrCode: QrCode,
  print: Printer,
  moreH: MoreHorizontal,
  moreV: MoreVertical,
  loading: Loader2,
} as const;

export type IconName = keyof typeof Icons;

// Helper to get icon by name
export function getIcon(name: IconName): LucideIcon {
  return Icons[name];
}

// Re-export LucideIcon type for convenience
export type { LucideIcon };
