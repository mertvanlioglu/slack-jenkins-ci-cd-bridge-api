# Slack → Jenkins Build Trigger Middleware

This project is a lightweight Node.js/Express middleware service that
securely connects Slack slash commands with a Jenkins CI pipeline.\
It verifies incoming Slack requests, parses build commands, and triggers
parameterized Jenkins jobs through the Jenkins REST API.

------------------------------------------------------------------------

## Overview

This middleware enables developers or team members to trigger CI builds
from Slack using a simple command:

    /build Repo/Branch

The system verifies the request signature, acknowledges Slack
immediately, and asynchronously triggers the Jenkins pipeline.

------------------------------------------------------------------------

## Features

-   Secure Slack request signature verification (HMAC SHA256)
-   Supports slash command `/build Repo/Branch`
-   Triggers Jenkins `buildWithParameters`
-   Automatically retrieves Jenkins crumb when CSRF protection is
    enabled
-   Async queueing of builds without blocking Slack
-   Raw-body parser for compatibility with Slack request signing
-   Lightweight Express implementation

------------------------------------------------------------------------

## Architecture

    Slack Slash Command → Node.js Middleware → Jenkins API → CI Build → Slack Notifications

The middleware acts as the secured gateway between Slack and the Jenkins
server.

## Requirements

-   Node.js 18 or later
-   Jenkins instance with API token enabled
-   Parameterized Jenkins job
-   Slack App configured with:
    -   Slash Command
    -   Signing Secret

------------------------------------------------------------------------

## Environment Variables

Create a `.env` file:

    PORT=3000
    SLACK_SIGNING_SECRET=your_slack_signing_secret
    JENKINS_URL=https://yourserver.com/jenkins
    JENKINS_USER=admin
    JENKINS_API_TOKEN=your_api_token
    JENKINS_JOB=Unity-Windows-CI
    JENKINS_JOB_PATH=job/Unity-Windows-CI
    JENKINS_TOKEN=optional_trigger_token

------------------------------------------------------------------------

## Installation

Install dependencies:

    npm install

Start the server:

    npm start

Development mode:

    npm run dev

------------------------------------------------------------------------

## Endpoints

### Health Check

    GET /health

Response:

    ok

------------------------------------------------------------------------

## Slack Slash Command Usage

Command format:

    /build RepoName/BranchName

Example:

    /build BreachPoint/main

Slack immediate response example:

    Build is queued: BreachPoint/main (by username)

------------------------------------------------------------------------

## Security

-   Slack request signatures are validated using timestamp + HMAC
    SHA256.
-   `crypto.timingSafeEqual` is used to avoid timing attacks.
-   Jenkins credentials and tokens must be stored in environment
    variables.
-   HTTPS is strongly recommended for all communication.

------------------------------------------------------------------------

## Code Structure

### 1. Slack Request Verification

Implements HMAC SHA256 verification following Slack requirements.

### 2. Raw Request Body Middleware

Slack signing requires access to the unparsed body; this middleware
collects it before JSON parsing.

### 3. Jenkins Trigger Function

Triggers Jenkins using: - Basic authentication\
- Optional crumb retrieval\
- Form-based parameter submission

### 4. Slack Command Handler

Parses `/build Repo/Branch`, acknowledges Slack, and triggers Jenkins
asynchronously.

------------------------------------------------------------------------

## Project Structure

    .
    ├── server.js
    ├── package.json
    ├── README.md
    ├── .env
    └── node_modules/

------------------------------------------------------------------------

## Example Logs

    POST /slack/build
    Slack signature verified
    Parsed: BreachPoint/main
    Jenkins trigger: 201 Created

------------------------------------------------------------------------

## Contributing

Contributions and improvements are welcome.\
You may extend the project to support additional CI systems or advanced
Slack workflows.

------------------------------------------------------------------------

## License

MIT License.

