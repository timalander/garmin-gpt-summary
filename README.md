# Garmin Health Summary Emailer

This application uses the `garmindb` Python package to sync health data from a Garmin device to an SQLite database. It then generates and sends a summary email containing the previous day's and month's health metrics, along with insights from the OpenAI GPT-3.5-turbo model. It utilizes Node.js, Express, SQLite3, OpenAI API, and Mailgun for email delivery.

## Docker Setup

To simplify deployment, I provide a Docker container that runs the TypeScript script, fetches data from the SQLite database, and sends an email with the summary. The setup also includes a Cron job that syncs the Garmin data with the container's local storage.

You can find the `Dockerfile` and `docker-compose.yml` in the repository. Before running the Docker container, make sure to replace the placeholders in the `docker-compose.yml` file with your own information, such as your Docker image name, database path, and email credentials.

## Cron Jobs

This project includes two Cron jobs:

1. Sync Garmin data at 4 am every day.
2. Trigger email at 7 am every day.

These Cron jobs are defined in the `crontab.txt` file and are initialized using the `init-cron.sh` script.

### sync-garmin-data.sh

This script runs the `garmindb_cli.py` command with the necessary options to download, import, and analyze the latest Garmin data.

### send-email.sh

This script sends an HTTP GET request to the `http://localhost:3000/send-summary` endpoint, triggering the TypeScript script to generate the summary and send the email.

## How to Run

1. Ensure you have Docker and Docker Compose installed on your system.
2. Clone this repository.
3. Create a `.env` file in the root directory of the project with your environment variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   MAILGUN_API_KEY=your_mailgun_api_key
   GARMIN_SUMMARY_DB_PATH=/path/to/your/garmin/data
   TO_EMAIL=recipient@example.com
   FROM_EMAIL=sender@example.com
   FROM_EMAIL_DOMAIN=your_email_domain
   ```
4. Replace the placeholders in the `docker-compose.yml` file with your own information:
   The `volumes:` section should be a mounted host storage where you can write the persistent Garmin data. Leave the `:/data` suffix (this specifies the VM mount point).
   The `image:` name can be anything you want.
  
5. Run `docker-compose up` to build and start the Docker container.

With this setup, you will receive a well-organized summary of your Garmin fitness data in your inbox every day at 7 am.
