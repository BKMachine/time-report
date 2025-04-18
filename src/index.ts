import axios from 'axios';
import { DateTime } from 'luxon';
import config from './config.js';
import email from './email.js';
import type {
  DateRange,
  AttendanceRecord,
  AttendanceReportResponse,
  EmployeeHours,
} from './types.js';

const API_URL = `https://api.clockit.io/api/v1/app/${config.appId}/basic_reports/attendance_report`;
const START_PAY_DATE = '2025-03-30';

function formatHoursToHHMM(decimalHours: number): string {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

function calculateDateRanges(startPayDate: string): DateRange[] {
  const startDate = DateTime.fromISO(startPayDate);
  const today = DateTime.now();

  const daysSinceStartPayDate = today.diff(startDate, 'days').days;
  const daysSinceLastPayday = daysSinceStartPayDate % 14;
  const lastPayday = today.minus({ days: daysSinceLastPayday });

  const week1Start = lastPayday.minus({ days: 13 });
  const week1End = week1Start.plus({ days: 6 });

  const week2Start = lastPayday.minus({ days: 6 });
  const week2End = lastPayday;

  return [
    { startDate: week1Start.toISODate(), endDate: week1End.toISODate() },
    { startDate: week2Start.toISODate(), endDate: week2End.toISODate() },
  ];
}

async function fetchEmployeeHours(startDate: string, endDate: string): Promise<AttendanceRecord[]> {
  return await axios
    .get<AttendanceReportResponse>(API_URL, {
      params: { start_date: startDate, end_date: endDate },
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'auth-version': 2,
        'Content-Type': 'application/json',
      },
    })
    .then(({ data }) => data.data)
    .catch((error) => {
      throw new Error(`Error fetching employee data: ${error.message}`);
    });
}

function parseEmployeeTimes(results: AttendanceRecord[][]): EmployeeHours[] {
  const totalHours = new Map<string, EmployeeHours>();

  results.forEach((week) => {
    const weeklyHours = new Map<string, number>();
    week.forEach((record) => {
      const name = record.first_name;
      if (!weeklyHours.has(name)) weeklyHours.set(name, 0);
      const regularHours = record.regular_work_duration_in_milliseconds / 3600000;
      const overtimeHours = record.total_direct_overtime_in_milliseconds / 3600000;
      const current = weeklyHours.get(name)!;
      weeklyHours.set(name, current + regularHours + overtimeHours);
    });

    for (const [name, hours] of weeklyHours.entries()) {
      if (!totalHours.has(name)) totalHours.set(name, { name, regularHours: 0, overtimeHours: 0 });
      const regularHours = Math.min(40, hours);
      const overtimeHours = Math.max(0, hours - 40);
      const employee = totalHours.get(name)!;
      employee.regularHours += regularHours;
      employee.overtimeHours += overtimeHours;
    }
  });

  config.salariedHours.forEach((salaried) => {
    const { name, hours } = salaried;
    if (!totalHours.has(name)) totalHours.set(name, { name, regularHours: 0, overtimeHours: 0 });
    const employee = totalHours.get(name)!;
    employee.regularHours = hours;
    employee.overtimeHours = 0;
  });

  return Array.from(totalHours.values()).sort((a, b) => a.name.localeCompare(b.name));
}

(async () => {
  console.log('Task started...');
  try {
    console.log('Getting date ranges...');
    const dateRanges = calculateDateRanges(START_PAY_DATE);
    console.log('Getting time records...');
    const results = await Promise.all(
      dateRanges.map(({ startDate, endDate }) => fetchEmployeeHours(startDate, endDate)),
    );
    console.log('Calculating employee hours...');
    const hours = parseEmployeeTimes(results);
    const finalResults = Object.entries(hours).map(([, employee]) => ({
      name: employee.name,
      regularHours: formatHoursToHHMM(employee.regularHours),
      overtimeHours: formatHoursToHHMM(employee.overtimeHours),
    }));
    console.log('Sending email report...');
    email(dateRanges, finalResults);
    console.log('Done!');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(errorMessage);
  } finally {
    setTimeout(() => {
      console.log('Exiting...');
    }, 3000);
  }
})();
