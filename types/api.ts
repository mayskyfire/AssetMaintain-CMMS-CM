// API DTOs - Data Transfer Objects for Frontend/Backend Communication

import type { UserRole, Priority, CMStatus, AssetStatus } from './database'

// ===== AUTH =====

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: UserInfo
  token: string
  expiresIn: number
}

export interface UserInfo {
  id: number
  email: string
  full_name: string
  role: UserRole
  phone_number: string | null
  is_active: boolean
}

// ===== CM NOTIFICATIONS =====

export interface CreateNotificationRequest {
  asset_id: number
  asset_code?: string
  problem_description: string
  priority: Priority
  problem_category?: string
  photos?: string[] // base64 or URLs
}

export interface CreateNotificationResponse {
  notification_id: string
  cm_history_id: number
  status: CMStatus
  message: string
}

export interface NotificationListItem {
  id: number
  notification_id: string
  asset_code: string
  asset_name: string
  location: string
  problem_description: string
  priority: Priority
  status: CMStatus
  breakdown_date: string
  reported_date: string | null
  technician_name: string | null
  requester_name: string | null
}

export interface NotificationDetail extends NotificationListItem {
  completion_date: string | null
  start_time: string | null
  problem_category: string | null
  root_cause: string | null
  corrective_action: string | null
  preventive_recommendation: string | null
  downtime_hours: number | null
  labor_hours: number | null
  total_cost: number | null
  satisfaction_rating: number | null
  satisfaction_comment: string | null
  timeline: TimelineEvent[]
  evidence_images: EvidenceImage[]
  parts_used: PartsUsedItem[]
}

export interface TimelineEvent {
  id: number
  event: string
  user: string | null
  status: string | null
  time: string
}

export interface EvidenceImage {
  id: number
  image_type: 'evidence' | 'before' | 'after'
  url: string
  caption: string | null
  file_name: string | null
}

export interface PartsUsedItem {
  id: number
  part_name: string
  part_no: string | null
  quantity: number
  unit: string
  unit_cost: number | null
  total_cost: number | null
}

// ===== TECHNICIAN JOBS =====

export interface TechnicianJob {
  id: number
  notification_id: string
  asset_code: string
  asset_name: string
  location: string
  problem_description: string
  priority: Priority
  status: CMStatus
  breakdown_date: string
  assigned_at: string | null
}

export interface AcceptJobRequest {
  cm_history_id: number
  accepted_by: string
  qr_scanned_start?: string
}

export interface WorklogEntry {
  cm_history_id: number
  start_time: string
  notes: string
  labor_hours?: number
}

export interface PartsRequest {
  cm_history_id: number
  parts: Array<{
    part_id?: number
    part_name: string
    part_no?: string
    quantity: number
    unit: string
    unit_cost?: number
  }>
}

export interface CloseoutRequest {
  cm_history_id: number
  root_cause: string
  corrective_action: string
  preventive_recommendation?: string
  completion_date: string
  qr_scanned_end?: string
  labor_hours: number
  photos?: string[] // base64 or URLs
  signature?: string // base64
  completed_by: string
}

// ===== SUPERVISOR =====

export interface SupervisorInboxItem {
  id: number
  notification_id: string
  asset_code: string
  asset_name: string
  location: string
  problem_description: string
  priority: Priority
  status: CMStatus
  breakdown_date: string
  reported_date: string
  requester_name: string
}

export interface AssignTechnicianRequest {
  cm_history_id: number
  technician_id: number
  supervisor_id: number
}

// ===== EVALUATION =====

export interface SubmitEvaluationRequest {
  cm_history_id: number
  satisfaction_rating: number // 1-5
  satisfaction_comment?: string
  evaluated_by: string
}

// ===== ASSETS =====

export interface AssetListItem {
  id: number
  asset_code: string
  asset_name: string
  asset_type: string
  location: string
  site: string
  zone: string
  status: AssetStatus
  installation_date: string
}

export interface AssetDetail extends AssetListItem {
  brand_model: string | null
  serial_number: string | null
  capacity: string | null
  building: string | null
  floor: string | null
  warranty_expiry: string | null
  cost_center: string | null
  purchase_cost: number | null
  notes: string | null
  recent_cm: NotificationListItem[]
  recent_pm: any[] // TODO: Add PM types
}

// ===== QR CODE =====

export interface QRCodeData {
  asset_id: number
  asset_code: string
  asset_name: string
  location: string
  site: string
  zone: string
}

// ===== STATISTICS =====

export interface DashboardStats {
  total_notifications: number
  pending: number
  in_progress: number
  completed: number
  avg_response_time_hours: number
  avg_completion_time_hours: number
}

export interface RequesterStats extends DashboardStats {
  recent_notifications: NotificationListItem[]
}

export interface TechnicianStats {
  total_jobs: number
  pending: number
  in_progress: number
  completed_this_month: number
  avg_rating: number
  recent_jobs: TechnicianJob[]
}

export interface SupervisorStats {
  total_pending: number
  critical_priority: number
  high_priority: number
  avg_assignment_time_hours: number
  team_performance: {
    technician_name: string
    completed_jobs: number
    avg_rating: number
  }[]
}

// ===== PAGINATION =====

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ===== FILTERS =====

export interface NotificationFilters extends PaginationParams {
  status?: CMStatus | CMStatus[]
  priority?: Priority | Priority[]
  search?: string
  date_from?: string
  date_to?: string
  asset_id?: number
  technician_id?: number
}

// ===== API RESPONSE =====

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface ApiError {
  success: false
  error: string
  message: string
  statusCode: number
}

// ===== SERVICE REQUEST/RESPONSE ALIASES =====

// Notification Service
export type NotificationListRequest = NotificationFilters
export type NotificationListResponse = PaginatedResponse<NotificationListItem>
export type NotificationDetailResponse = NotificationDetail
export type EvaluateNotificationRequest = SubmitEvaluationRequest
export type EvaluateNotificationResponse = ApiResponse

// Technician Service
export type TechnicianJobsRequest = PaginationParams & {
  status?: CMStatus | CMStatus[]
}
export type TechnicianJobsResponse = TechnicianJob[]
export type TechnicianJobDetail = NotificationDetail
export type TechnicianJobDetailResponse = TechnicianJobDetail
export type AcceptJobResponse = ApiResponse
export type AddWorklogRequest = WorklogEntry
export type AddWorklogResponse = ApiResponse
export type RequestPartsRequest = PartsRequest
export type RequestPartsResponse = ApiResponse
export type CloseoutJobRequest = CloseoutRequest
export type CloseoutJobResponse = ApiResponse
export type TechnicianStatsResponse = TechnicianStats

// Supervisor Service
export type SupervisorInboxRequest = PaginationParams & {
  priority?: Priority | Priority[]
}
export type SupervisorInboxResponse = SupervisorInboxItem[]
export type AvailableTechnician = {
  id: number
  full_name: string
  current_jobs: number
  avg_rating: number
  is_available: boolean
}
export type AvailableTechniciansResponse = AvailableTechnician[]
export type AssignTechnicianResponse = ApiResponse
export type SupervisorStatsResponse = SupervisorStats
