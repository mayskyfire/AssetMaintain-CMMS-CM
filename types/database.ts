// Database Types - Generated from MySQL Schema
// Compatible with MySQL/MariaDB

// ===== ENUMS =====

export type UserRole = 'admin' | 'planner' | 'technician' | 'vendor' | 'requester' | 'engineer'
export type AssetStatus = 'active' | 'inactive' | 'maintenance' | 'retired'
export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type CMStatus = 'reported' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
export type PMStatus = 'completed' | 'incomplete' | 'cancelled'
export type PlanStatus = 'active' | 'paused' | 'completed' | 'cancelled'
export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'usage'
export type CalculationRule = 'A' | 'B'
export type RecurringInterval = 'monthly' | 'quarterly' | 'semi' | 'yearly'
export type ImageType = 'evidence' | 'before' | 'after'
export type AttachmentType = 'before_image' | 'after_image' | 'document' | 'report'
export type ChecklistStatus = 'pass' | 'fail' | 'na'
export type NotificationType = 'pm_reminder' | 'pm_overdue' | 'cm_reported' | 'cm_alert' | 'system' | 'assigned' | 'completed' | 'overdue' | 'upcoming'
export type NotificationChannel = 'email' | 'line' | 'teams' | 'in-app'
export type NotificationStatus = 'pending' | 'sent' | 'failed'
export type SLAStatus = 'safe' | 'warning' | 'critical' | 'overdue' | 'completed'

// ===== BASE TYPES =====

export interface BaseEntity {
  id: number
  created_at: string
  updated_at: string
}

// ===== USER & AUTH =====

export interface User extends BaseEntity {
  email: string
  password_hash: string
  full_name: string
  role: UserRole
  phone_number: string | null
  line_id: string | null
  is_active: boolean
  last_login: string | null
}

export interface Role extends BaseEntity {
  name: string
  display_name: string
  description: string | null
  is_active: boolean
}

export interface RolePermission extends BaseEntity {
  role_name: string
  module: string
  can_view: boolean
  can_edit: boolean
  can_delete: boolean
  can_export: boolean
}

// ===== ASSETS =====

export interface AssetType extends BaseEntity {
  type_code: string
  type_name: string
  category: string | null
  default_pm_interval_days: number | null
  description: string | null
  is_active: boolean
}

export interface Asset extends BaseEntity {
  asset_code: string
  asset_type_id: number
  asset_name: string
  brand_model: string | null
  serial_number: string | null
  capacity: string | null
  location: string
  site: string
  zone: string
  building: string | null
  floor: string | null
  installation_date: string
  warranty_expiry: string | null
  cost_center: string | null
  purchase_cost: number | null
  status: AssetStatus
  notes: string | null
}

// ===== CM (Corrective Maintenance) =====

export interface CMHistory extends BaseEntity {
  notification_id: string | null
  asset_id: number
  breakdown_date: string
  reported_date: string | null
  completion_date: string | null
  start_time: string | null
  problem_category: string | null
  problem_description: string
  root_cause: string | null
  corrective_action: string | null
  preventive_recommendation: string | null
  technician_id: number | null
  supervisor_id: number | null
  supervisor_approved: boolean
  supervisor_approved_at: string | null
  accepted_by: string | null
  accepted_at: string | null
  completed_by: string | null
  qr_scanned_start: string | null
  qr_scanned_end: string | null
  requester_id: number | null
  priority: Priority
  status: CMStatus
  downtime_hours: number | null
  labor_hours: number | null
  labor_cost: number | null
  parts_cost: number | null
  external_cost: number | null
  satisfaction_rating: number | null
  satisfaction_comment: string | null
  evaluated_by: string | null
  evaluated_at: string | null
  plant: string
  total_cost: number | null
  notes: string | null
}

export interface CMEvidenceImage {
  id: number
  cm_history_id: number
  image_type: ImageType
  url: string
  caption: string | null
  file_name: string | null
  file_size: number | null
  uploaded_by: number | null
  created_at: string
}

export interface CMPartsUsed {
  id: number
  cm_history_id: number
  part_id: number | null
  part_name: string
  part_no: string | null
  quantity: number
  unit: string
  unit_cost: number | null
  total_cost: number | null
  stock_before: number | null
  stock_after: number | null
  created_at: string
}

export interface CMTimeline {
  id: number
  cm_history_id: number
  event: string
  user: string | null
  status: string | null
  time: string
  created_at: string
}

// ===== PM (Preventive Maintenance) =====

export interface PMTemplate extends BaseEntity {
  asset_type_id: number
  template_name: string
  description: string | null
  frequency: string | null
  is_active: boolean
  estimated_duration_hours: number | null
}

export interface PMTask extends BaseEntity {
  template_id: number
  task_name: string
  task_description: string | null
  task_order: number
  is_required: boolean
  estimated_time_minutes: number | null
}

export interface PMPlan extends BaseEntity {
  plan_id: string | null
  asset_id: number
  plan_name: string
  template_id: number | null
  pm_type: string | null
  estimated_duration: number | null
  priority: Priority
  frequency_type: FrequencyType
  frequency_value: number
  calculation_rule: CalculationRule
  start_date: string
  last_pm_date: string | null
  next_pm_date: string
  scheduled_date: string | null
  assigned_technician_id: number | null
  status: PlanStatus
  is_recurring: boolean
  recurring_interval: RecurringInterval | null
  notes: string | null
}

export interface PMHistory extends BaseEntity {
  pm_plan_id: number | null
  asset_id: number
  completion_date: string
  technician_id: number
  status: PMStatus
  labor_hours: number | null
  labor_cost: number | null
  parts_cost: number | null
  total_cost: number | null
  is_on_time: boolean | null
  days_overdue: number
  notes: string | null
  supervisor_approved: boolean
  supervisor_approved_at: string | null
  start_time: string | null
  findings: string | null
  recommendations: string | null
}

export interface PMChecklistResult {
  id: number
  pm_history_id: number
  task_id: number
  status: ChecklistStatus
  notes: string | null
  created_at: string
}

export interface PMPartsUsed {
  id: number
  pm_history_id: number
  part_id: number | null
  part_name: string
  quantity: number
  unit_cost: number | null
  total_cost: number | null
  created_at: string
}

export interface PMAttachment extends BaseEntity {
  entity_type: 'pm_history' | 'cm_history' | 'asset'
  entity_id: number
  file_name: string
  file_path: string
  file_type: string | null
  file_size: number | null
  attachment_type: AttachmentType
  description: string | null
  display_order: number
  uploaded_by: number | null
}

// ===== PARTS & MATERIALS =====

export interface PartsMaterial extends BaseEntity {
  part_code: string | null
  part_name: string
  category: string | null
  unit: string | null
  unit_cost: number | null
  stock_quantity: number
  min_stock_level: number | null
  supplier: string | null
  notes: string | null
}

// ===== NOTIFICATIONS =====

export interface Notification extends BaseEntity {
  notification_type: NotificationType
  recipient_id: number | null
  recipient_email: string | null
  channel: NotificationChannel
  subject: string | null
  message: string
  status: NotificationStatus
  sent_at: string | null
  error_message: string | null
  user_id: number | null
  type: string | null
  title: string | null
  is_read: boolean
  read_at: string | null
  plan_id: string | null
  asset_id: number | null
  sla_due_date: string | null
  sla_status: SLAStatus
  priority_level: Priority
  metadata: any | null
  auto_generated: boolean
  parent_notification_id: number | null
}

// ===== SETTINGS =====

export interface Setting extends BaseEntity {
  setting_key: string
  setting_value: string | null
  setting_type: 'string' | 'number' | 'boolean' | 'json'
  description: string | null
  updated_by: number | null
}
