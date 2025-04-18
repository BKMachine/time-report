import { DateTime } from 'luxon';
import nodemailer from 'nodemailer';
import config from './config.js';
import type { DateRange } from './types.js';

export default function send(
  dateRanges: DateRange[],
  finalResults: { name: string; regularHours: string; overtimeHours: string }[],
) {
  const lastRangeEndDate = DateTime.fromISO(dateRanges[1]?.endDate as string);
  const daysAgo = DateTime.now().diff(lastRangeEndDate, 'days').days;
  const daysAgoText = daysAgo === 0 ? 'today' : `${Math.round(daysAgo)} days ago`;

  const htmlTableRows = finalResults
    .map(
      ({ name, regularHours, overtimeHours }) => `
            <tr>
                <td>${name}</td>
                <td>${regularHours}</td>
                <td>${overtimeHours}</td>
            </tr>
        `,
    )
    .join('');

  const htmlContent = `
            <h1>Payroll Report</h1>
            <p>
              Date Range: ${dateRanges[0]?.startDate} to ${dateRanges[1]?.endDate}
              <br>
              (Ended ${daysAgoText})
            </p>
            <table border="1" cellpadding="5" cellspacing="0">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Regular Hours</th>
                        <th>Overtime Hours</th>
                    </tr>
                </thead>
                <tbody>
                    ${htmlTableRows}
                </tbody>
            </table>
        `;

  const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.username,
      pass: config.email.password,
    },
    tls: { rejectUnauthorized: false },
  });

  const mailOptions = {
    from: config.email.username,
    to: config.email.recipients.join(', '),
    subject: 'Combined Hours Report',
    html: htmlContent,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) throw new Error('Error sending email: ' + error.message);
  });
}
