import * as sqlite3 from 'sqlite3';
import axios from 'axios';
import * as dotenv from 'dotenv';
import MailgunClient from 'mailgun.js';
import FormData from 'form-data';
import express from 'express';

const app = express();
const port = 3000;

dotenv.config();

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GARMIN_SUMMARY_DB_PATH = process.env.GARMIN_SUMMARY_DB_PATH;
const TO_EMAIL = process.env.TO_EMAIL || '';
const FROM_EMAIL = process.env.FROM_EMAIL;
const FROM_EMAIL_DOMAIN = process.env.FROM_EMAIL_DOMAIN || '';

const sendEmail = async (text: string, html: string): Promise<void> => {
  const mailgun = new MailgunClient(FormData);
  const mg = mailgun.client({
    username: 'api',
    key: MAILGUN_API_KEY,
  });

  try {
    await mg.messages.create(FROM_EMAIL_DOMAIN, {
      from: `Garmin Assistant <${FROM_EMAIL}>`,
      to: [TO_EMAIL],
      subject: `Garmin Daily Report - ${new Date().toLocaleDateString()}`,
      text: text,
      html: html,
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error(`Error sending email: ${(error as Error).message}`);
  }
};

const formatTimeString = (timeString: string): string => {
  const timeParts = timeString.split(':');
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);

  return `${hours}hr ${minutes}min`;
};

const formatDayData = (data: any): any => {
  const formattedText = `
    Date: ${data.day}
    Avg. Heart Rate: ${parseFloat(data.hr_avg.toFixed(1))} bpm
    Max. Heart Rate: ${parseFloat(data.hr_max.toFixed(1))} bpm
    Resting Heart Rate: ${parseFloat(data.rhr_avg.toFixed(1))} bpm
    Inactive Heart Rate: ${parseFloat(data.inactive_hr_avg.toFixed(1))} bpm
    Steps: ${data.steps}
    Sleep: ${formatTimeString(data.sleep_avg)}
    REM Sleep: ${formatTimeString(data.rem_sleep_avg)}
    Stress: ${parseFloat(data.stress_avg).toFixed(1)}
    Active Calories: ${data.calories_active_avg}
  `;

  const formattedData = {
    date: data.day,
    hr_avg: `${parseFloat(data.hr_avg.toFixed(1))} bpm`,
    hr_max: `${parseFloat(data.hr_max.toFixed(1))} bpm`,
    rhr_avg: `${parseFloat(data.rhr_avg.toFixed(1))} bpm`,
    inactive_hr_avg: `${parseFloat(data.inactive_hr_avg.toFixed(1))} bpm`,
    steps: data.steps,
    sleep_avg: formatTimeString(data.sleep_avg),
    rem_sleep_avg: formatTimeString(data.rem_sleep_avg),
    stress_avg: parseFloat(data.stress_avg).toFixed(1),
    calories_active_avg: data.calories_active_avg,
    summary: formattedText,
  };

  return formattedData;
};

const formatMonthData = (data: any): any => {
  const formattedText = `
    Avg. Heart Rate: ${parseFloat(data.hr_avg.toFixed(1))} bpm
    Resting Heart Rate: ${parseFloat(data.rhr_avg.toFixed(1))} bpm
    Inactive Heart Rate: ${parseFloat(data.inactive_hr_avg.toFixed(1))} bpm
    Sleep: ${formatTimeString(data.sleep_avg)}
    REM Sleep: ${formatTimeString(data.rem_sleep_avg)}
    Stress: ${parseFloat(data.stress_avg).toFixed(1)}
  `;

  const formattedData = {
    hr_avg: `${parseFloat(data.hr_avg.toFixed(1))} bpm`,
    rhr_avg: `${parseFloat(data.rhr_avg.toFixed(1))} bpm`,
    inactive_hr_avg: `${parseFloat(data.inactive_hr_avg.toFixed(1))} bpm`,
    sleep_avg: formatTimeString(data.sleep_avg),
    rem_sleep_avg: formatTimeString(data.rem_sleep_avg),
    stress_avg: parseFloat(data.stress_avg).toFixed(1),
    summary: formattedText,
  };

  return formattedData;
};

const generateTableRows = (
  formattedDayData: any,
  formattedMonthData: any
): string => {
  const namedKeys = {
    hr_avg: 'Avg. Heart Rate',
    hr_max: 'Max. Heart Rate',
    rhr_avg: 'Resting Heart Rate',
    inactive_hr_avg: 'Inactive Heart Rate',
    steps: 'Steps',
    sleep_avg: 'Sleep',
    rem_sleep_avg: 'REM Sleep',
    stress_avg: 'Stress',
    calories_active_avg: 'Active Calories',
  };

  const rows = Object.keys(formattedDayData).map(key => {
    const rowName = (namedKeys as any)[key];
    if (key !== 'summary' && key !== 'date') {
      return `
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px;">${rowName}</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${
            formattedDayData[key]
          }</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${
            formattedMonthData[key] ? formattedMonthData[key] : '---'
          }</td>
        </tr>
      `;
    }
  });

  return rows.join('');
};

const generateEmailHTML = (
  summary: string,
  previousDayData: any,
  previousMonthData: any
): string => {
  const formattedDayData = formatDayData(previousDayData);
  const formattedMonthData = formatMonthData(previousMonthData);
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Summary</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0;">
    <div class="container" style="max-width: 600px; margin: 0 auto; padding: 16px;">
      <div class="summary" style="padding: 16px; background-color: #f8f8f8; border: 1px solid #e8e8e8; border-radius: 4px; margin-bottom: 24px;">
        ${summary.replace(/\n/g, '<br>')}
      </div>
      <table style="border-collapse: collapse; width: 100%; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6;">
        <thead>
          <tr>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f2f2f2; font-weight: bold;">Metric</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f2f2f2; font-weight: bold;">Yesterday</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f2f2f2; font-weight: bold;">Last Month</th>
          </tr>
        </thead>
        <tbody>
        ${generateTableRows(formattedDayData, formattedMonthData)}
        </tbody>
      </table>
    </div>
  </body>
  </html>
  `;
};

const analyzeData = async (
  previousDayData: any,
  previousMonthData: any
): Promise<string> => {
  const apiKey = OPENAI_API_KEY;
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  const formattedDayData = formatDayData(previousDayData);
  const formattedMonthData = formatMonthData(previousMonthData);

  try {
    const response = await axios.post(
      apiUrl,
      {
        messages: [
          {
            role: 'system',
            content: `Imagine you are a personal trainer and assistant.
            You are a former Olympic marathon runner, with a PHD in Sport Physiology and Sport Performance.
            Pretend you are talking casually with your client.
            Your goal is to look at their health data and determine what is noteworthy to share. 
            You want to help the client improve their cardiovascular health and running performance.
            Your client understands sports science and physiology.
            Be concise, but provide detail when necessary.Be friendly and encouraging.
            First paragraph, provide a overview of their key health metrics from yesterday.
            Example 1: You got a lot of REM sleep yesterday: 2 hrs 2 min! This is great for recovery.
            Example 2: You only got 5 hrs 30 min of sleep yesterday. This is not enough for recovery.
            Just select at most 3 metrics to share, with accompanying relevant analysis.
            Second paragraph, compare at most 3 metrics from the daily data to the previous month's data.
            Example 1: Your RHR yesterday was 1.2 BPM lower than last month's average.
            Example 2: Your RHR yesterday was 5.7 BPM higher than last month's average.
            Only compare if the daily data is significantly different from the average of the previous month. Do not simply list the data.
            Use numerals for numbers, not words. Example: 5, not five.
            Only highloght information relevant to improving cardiovascular health and exercise performance.
            You must output with basic HTML formatting for the statistic in the summary (bold, italics). Example <b>bold</b> <i>italics</i>.
            Previous Day Data:\n${formattedDayData.summary}\n Previous Month Data:\n${formattedMonthData.summary}`,
          },
        ],
        max_tokens: 1000,
        model: 'gpt-3.5-turbo',
        temperature: 0.6,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    throw new Error(`Error calling OpenAI API: ${(error as Error).message}`);
  }
};

const openDatabase = async (path: string): Promise<sqlite3.Database> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(path, err => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
};

const runQuery = async (
  db: sqlite3.Database,
  query: string,
  params: any[] = []
): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (error, row) => {
      if (error) {
        reject(error);
      } else {
        resolve(row);
      }
    });
  });
};

const getDateInTimezone = (date: Date, timezone: string): Date => {
  const dateString = date.toLocaleString('en-US', { timeZone: timezone });
  return new Date(dateString);
};

const getPreviousDayData = async (): Promise<any> => {
  const db = await openDatabase(`${GARMIN_SUMMARY_DB_PATH}/garmin_summary.db`);
  const currentDate = getDateInTimezone(new Date(), 'America/New_York');
  currentDate.setDate(currentDate.getDate() - 1);
  const previousDate = currentDate.toISOString().split('T')[0];
  console.log('Previous date:', previousDate);
  try {
    const row = await runQuery(db, 'SELECT * FROM days_summary WHERE day=?', [
      previousDate,
    ]);
    return row;
  } catch (error) {
    throw new Error(
      `Error fetching previous day data: ${(error as Error).message}`
    );
  } finally {
    db.close();
  }
};

const getPreviousMonthData = async (): Promise<any> => {
  const db = await openDatabase(`${GARMIN_SUMMARY_DB_PATH}/garmin_summary.db`);
  const currentDate = getDateInTimezone(new Date(), 'America/New_York');
  currentDate.setMonth(currentDate.getMonth() - 1);
  const firstDayPreviousMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  )
    .toISOString()
    .split('T')[0];

  console.log('Previous month:', firstDayPreviousMonth);
  try {
    const row = await runQuery(
      db,
      'SELECT * FROM months_summary WHERE first_day=?',
      [firstDayPreviousMonth]
    );
    return row;
  } catch (error) {
    throw new Error(
      `Error fetching previous month data: ${(error as Error).message}`
    );
  } finally {
    db.close();
  }
};

const sendSummaryEmail = async () => {
  const previousDayData = await getPreviousDayData();
  const previousMonthData = await getPreviousMonthData();

  if (previousDayData) {
    const summary = await analyzeData(previousDayData, previousMonthData);
    await sendEmail(
      summary,
      generateEmailHTML(summary, previousDayData, previousMonthData)
    );
  } else {
    console.log('No data available for the previous day.');
  }
};

app.get('/send-summary', async (req, res) => {
  try {
    await sendSummaryEmail();
    res.status(200).send('Summary email sent successfully.');
  } catch (error) {
    console.error('Error sending summary email:', error);
    res.status(500).send('Error sending summary email.');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
