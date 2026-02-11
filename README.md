# Node typescript jump start

## Project setup
- Install npm packages
```bash
$ npm install
``` 
- Install mongodb
  - https://www.mongodb.com/docs/manual/installation/
- create `.env` file and add required variables.

- Take reference from `example.env` and create new `.env` file and Set the `environment` variables. Like,

```bash
NODE_ENV=local
PORT=5000
MONGODB_URL=mongodb://localhost:27017/ts-jump-start-db
JWT_SECRET=uandITYrisTiVesoLetrOTiCKeTerGaCAniRecLoBoDyNyWORKBuzEsHcrIateME
JWT_ACCESS_TOKEN_EXPIRY_IN_SECONDS=86400
LOG_LEVEL=all
ALERT_LOG_LEVEL=error
```

## Start server in dev mode

- Run following command to CLI to start the Project.

```bash
  npm run start:dev
```

- Import the `Postman Collection` to postman app, and set environment variable `base_url` with your base url of the app. For eg, `base_url = http://localhost:5000`

## Lint code
```bash
npm run lint
```

## Run e2e test cases
```bash
npm run test:e2e
```


### Run in Docker Environment

- Run docker-compose file:

```bash
$ docker-compose up --build
```

---

# DevOps & Deployment

### 1. Standalone Server Deployment
This project is deployed on a **standalone server**, meaning we manage our own **cloud server** instead of using fully managed platforms.  
- The server is a **Linux machine**, configured with necessary dependencies like **Node.js, PM2, and Nginx**.  
- Since this project uses **TypeScript**, the application must be **compiled** before running.

### 2. Continuous Deployment (CD) with GitHub Actions
Deployment is automated using **GitHub Actions**, which ensures seamless updates when changes are pushed to the repository.  
- A **workflow** is triggered when code is pushed to a specific branch (e.g., `master` for production).  
- The workflow file is stored in **.github/workflows/{workflow-file}.yml**.

- This file contains steps to **connect to the server, update environment variables, pull the latest code, compile TypeScript, and restart the application**.

### 3. Deployment Workflow Overview
1. **Code Push**: Developer pushes changes to the `master` branch.  
2. **GitHub Actions Triggered**: The workflow runs automatically.  
3. **Secure Authentication**: The workflow securely connects to the remote server using **GitHub Secrets**.  
4. **Deployment on Server**:  
 - Pulls the latest code from the repository.  
 - Installs dependencies using `npm i`.  
 - Updates environment variables (`.env` file).
 - remove the old build.  
 - **Builds the TypeScript code** (`npm run build`).  
 - Restarts the application using **PM2**, referencing the **ecosystem file**.

### 4. Secure Server Authentication
For **secure access** to the remote server, **GitHub Secrets** are used to store sensitive information.  
- Secrets include SSH keys, environment variables, and API keys.  
- Only repository **admins (usually DevOps engineers)** have access.  
- GitHub injects these secrets into the workflow securely.

## 5. Environment-Specific Secret Variables  
The project supports **environment-based GitHub Secrets**, allowing deployments for different environments like **Development (DEV), Staging (STAGE), and Production (PROD)**.  

- Each environment has its own set of secrets stored in GitHub, following a naming convention like `DEV_`, `STAGE_`, and `PROD_`.  
- The workflow dynamically selects the correct secrets based on the branch being deployed.  
- This ensures **secure, environment-specific configurations** without hardcoding values in the repository.  

### 6. PM2 Process Management
On the server, **PM2** is used to manage and keep the Express TypeScript application running.  
- The **PM2 ecosystem file** (`ecosystem.master.config.js`) defines how the application should be started.  
- The deployment workflow ensures that the application is restarted after updates.

### 7. TypeScript Compilation in Production
Unlike regular JavaScript projects, an **Express.js + TypeScript** application must be compiled before running.  
- The `tsconfig.json` settings define how the compilation happens.  
- During deployment, **the workflow ensures the TypeScript code is built (`npm run build`)** before restarting the app.

For further assistance, reach out to the **DevOps team**.

---

# Deployment Notifications API

Base path: `/deploy`

## POST `/deploy/start`
Sends a **deployment started** notification to Microsoft Teams and returns a `threadId`.

### Request body
Required:
- `teamId` (string)
- `channelId` (string)
- `repoName` (string)
- `repoLink` (string) – the link behind display value `repoName`
- `commitShaName` (string) – display value
- `commitShaLink` (string) – the link behind display value `commitShaName`
- `startTime` (string, ISO-8601)
- `actionLink` (string) – shown as a button
- `triggerBy` (string)
- `environment` (string) – expected values: `dev` | `staging` | `prod`

Optional:
- `emailIds` (string) – comma-separated string; if present and contains at least one valid email, an email is sent
- `adaptiveCard` (object) – override the generated Teams card

### Example
```json
{
	"teamId": "team-id",
	"channelId": "19:channel-id@thread.tacv2",
	"repoName": "my-service",
	"repoLink": "https://github.com/org/my-service",
	"commitShaName": "a1b2c3d",
	"commitShaLink": "https://github.com/org/my-service/commit/a1b2c3d4e5",
	"startTime": "2026-02-10T10:10:00.000Z",
	"actionLink": "https://github.com/org/my-service/actions/runs/123",
	"triggerBy": "parth",
	"environment": "staging",
	"emailIds": "dev1@company.com, dev2@company.com"
}
```

### Response
```json
{
	"success": true,
	"message": "Deployment start notification sent",
	"data": {
		"threadId": "<teams-thread-id>"
	}
}
```

## POST `/deploy/result`
Sends a **deployment result** notification to Microsoft Teams as a reply to `threadId`.

### Request body
Required:
- `teamId` (string)
- `channelId` (string)
- `threadId` (string)
- `repoName` (string)
- `repoLink` (string)
- `durationInSeconds` (number)
- `startTime` (string, ISO-8601)
- `status` (string) – `success` | `fail`
- `triggerBy` (string)
- `environment` (string) – expected values: `dev` | `staging` | `prod`

Optional:
- `errorMessage` (string) – trimmed to 300 characters in Teams card + email
- `emailIds` (string) – comma-separated string; if present and contains at least one valid email, an email is sent
- `adaptiveCard` (object) – override the generated Teams card

### Example (success)
```json
{
	"teamId": "team-id",
	"channelId": "19:channel-id@thread.tacv2",
	"threadId": "<teams-thread-id>",
	"repoName": "my-service",
	"repoLink": "https://github.com/org/my-service",
	"durationInSeconds": 93,
	"startTime": "2026-02-10T10:10:00.000Z",
	"status": "success",
	"triggerBy": "parth",
	"environment": "staging",
	"emailIds": "dev1@company.com, dev2@company.com"
}
```

### Example (fail)
```json
{
	"teamId": "team-id",
	"channelId": "19:channel-id@thread.tacv2",
	"threadId": "<teams-thread-id>",
	"repoName": "my-service",
	"repoLink": "https://github.com/org/my-service",
	"durationInSeconds": 93,
	"startTime": "2026-02-10T10:10:00.000Z",
	"status": "fail",
	"triggerBy": "parth",
	"environment": "staging",
	"errorMessage": "Build failed due to ...",
	"emailIds": "dev1@company.com, dev2@company.com"
}
```

### Notes
- Times shown in Teams cards & emails are formatted as **IST (Asia/Kolkata)** and explicitly include `IST`.

## Email (SMTP) configuration
Emails use SMTP env vars:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`true` for 465, otherwise `false`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (optional; defaults to `SMTP_USER`)
