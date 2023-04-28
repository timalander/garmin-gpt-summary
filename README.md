# Garmin Health Summary Emailer

This application uses the `garmindb` Python package to sync health data from a Garmin device to an SQLite database. It then generates and sends a summary email containing the previous day's and month's health metrics, along with insights from the OpenAI GPT-3.5-turbo model. It utilizes Node.js, Express, SQLite3, OpenAI API, and Mailgun for email delivery.

## Prerequisites

Before you can run the Garmin Summary Emailer, you need to have the following tools and services set up:

1. **Docker**: Install Docker on your system. Docker allows you to build, package, and distribute applications in a consistent and reproducible way. Visit [Docker's official website](https://www.docker.com/) for installation instructions.

2. **Docker Compose**: Install Docker Compose, which enables you to manage multi-container applications. Follow the installation instructions on the [official Docker Compose website](https://docs.docker.com/compose/install/).

3. **OpenAI API Key**: Sign up for an OpenAI account and obtain an API key. This key is required to access OpenAI's GPT-3 model, which generates the fitness summary. Visit [OpenAI's API documentation](https://beta.openai.com/docs/) to get started.

4. **Mailgun API Key**: Sign up for a Mailgun account and obtain an API key. This key is needed to send the summary email using the Mailgun service. Visit [Mailgun's official website](https://www.mailgun.com/) to create an account and obtain an API key.

5. **Garmin Connect Account**: Ensure you have a Garmin Connect account set up with data from your Garmin watch. This project uses the garmindb library to download and analyze your data.

Once you have these prerequisites in place, you can follow the "How to Run" section to set up and run the Garmin Summary Emailer.

## Docker Setup

To simplify deployment, I provide a Docker container that runs the TypeScript script, fetches data from the SQLite database, and sends an email with the summary. The setup also includes a Cron job that syncs the Garmin data with the container's local storage.

You can find the `Dockerfile` and `docker-compose.yml` in the repository. Before running the Docker container, make sure to replace the placeholders in the `docker-compose.yml` file with your own information, such as your Docker image name, database path, and email credentials.

## Cron Jobs

This project includes two Cron jobs:

1. Sync Garmin data at 11:30am EST every day.
2. Trigger email at 12pm EST every day.

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
   GARMIN_SUMMARY_DB_PATH=/data/DBs
   TO_EMAIL=recipient@example.com
   FROM_EMAIL=sender@example.com
   FROM_EMAIL_DOMAIN=your_email_domain
   ```
   * Important note: `garmindb` needs a persistent storage location to write the SQlite files. `GARMIN_SUMMARY_DB_PATH` should be set to an internally accessible path that stores the `garmin_summary.db` file. By default, this file lives in `/data/DBs`.
4. Replace the placeholders in the `docker-compose.yml` file with your own information:
   * The `volumes:` section should be a mounted host storage where you can write the persistent Garmin data. Leave the `:/data` suffix (this specifies the VM mount point).
   * The `image:` name can be anything you want.

5. Edit the `GarminConnectConfig.json` file, adding your Garmin username and password.
  
6. Run `docker-compose up` to build and start the Docker container.

With this setup, you will receive a well-organized summary of your Garmin fitness data in your inbox every day at 7 am.
