export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface AttendanceReportResponse {
  data: AttendanceRecord[];
}

export interface AttendanceRecord {
  date: string;
  user_id: string;
  first_name: string;
  last_name: string;
  gender: string;
  group_name: string;
  template_name: string;
  email: string;
  employee_id: string;
  tags: string[];
  department_name: string;
  site_id: string;
  site_name: string;
  manager_first_name: string | null;
  manager_last_name: string | null;
  manager_email: string | null;
  total_duration_in_milliseconds: number;
  total_breakDuration_in_milliseconds: number;
  total_worked_duration_in_milliseconds: number;
  required_work_duration_in_milliseconds: number;
  total_direct_overtime_in_milliseconds: number;
  regular_work_duration_in_milliseconds: number;
  tpi: number;
  pe: number;
  is_on_approved_leave: number;
  is_on_approved_business_travel: number;
  is_holiday: number;
  punched_in: string | null;
  punched_out: string | null;
  number_of_breaks: number;
  allowed_break_duration_in_milliseconds: number;
  excess_break_duration_in_milliseconds: number;
  late_by_in_milliseconds: number;
  early_by_in_milliseconds: number;
  early_going_in_milliseconds: number;
  late_going_in_milliseconds: number;
  status: string;
  leave_type_name: string | null;
  number_of_leave_units_in_milliseconds: number | null;
}

export interface EmployeeHours {
  name: string;
  regularHours: number;
  overtimeHours: number;
}
