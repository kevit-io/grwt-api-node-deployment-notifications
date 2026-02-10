# **SonarQube & SonarScanner Setup Guide**

## **Table of Contents**
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [SonarQube Setup](#sonarqube-setup)
   - [Using Docker (Recommended)](#using-docker-recommended)
   - [Using Manual Installation](#using-manual-installation)
4. [SonarScanner Installation](#sonarscanner-installation)
   - [Using Docker](#using-docker)
   - [On Windows](#on-windows)
   - [On Linux (Ubuntu/Debian)](#on-linux-ubuntudebian)
   - [On macOS](#on-macos)
5. [Running Code Analysis](#running-code-analysis)
   - [Run Tests and Generate Coverage with jest](#run-tests-and-generate-coverage-with-jest)
6. [Viewing Analysis Results](#viewing-analysis-results)
7. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
8. [Starting Docker & Managing Containers](#starting-docker--managing-containers)
9. [Additional Configurations](#additional-configurations)
10. [References](#references)

---

## **Introduction**

SonarQube is an open-source platform that continuously **inspects code quality and security vulnerabilities**. It supports multiple languages and integrates well with CI/CD pipelines.

SonarScanner is the official tool used to scan projects and send reports to a SonarQube server for analysis.

---

## **Prerequisites**

### **Before You Begin, Ensure You Have:**
✔️ **Docker** (for containerized setup) OR Java 17+ (for manual setup)
✔️ At least **2GB RAM** allocated to SonarQube
✔️ **Admin Access** on your machine
✔️ **Git Installed** (optional but recommended)

---

## **SonarQube Setup**

### **Using Docker (Recommended)**
1️⃣ **Pull the SonarQube Docker Image**
```bash
docker pull sonarqube:latest
```

2️⃣ **Run SonarQube Container**
```bash
docker run -d --name sonarqube \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  -p 9000:9000 sonarqube:latest
```

3️⃣ **Verify the Container is Running**
```bash
docker ps | grep sonarqube
```
You should see output indicating SonarQube is active on **port 9000**.

4️⃣ **Access the Web UI**
- Open **[http://localhost:9000](http://localhost:9000)** in your browser.
- Log in with **admin / admin** (Change the password immediately!).

5️⃣ **Generate a SonarQube Token**
- create new project.
- set project name and key.
- generate project token and save it, as you won't be able to see that again.
- update all details inside code, inside `sonar-project.properties` file.


---

### **Using Manual Installation**

🔹 Download **SonarQube** from the [official site](https://www.sonarqube.org/downloads/).
🔹 Extract the archive:
```bash
tar -xvzf sonarqube-*.zip
```
🔹 Start the server:
```bash
cd sonarqube/bin/linux-x86-64
./sonar.sh start
```
🔹 Follow steps **4 & 5** from the Docker setup.

---

## **SonarScanner Installation**

Install the SonarScanner globally:
```bash
npm install -g sonarqube-scanner
```

Or, install it locally in your project:
```bash
npm install --save-dev sonarqube-scanner
```

---

## **Running Code Analysis**

1️⃣ **Navigate to Your Project Directory**
```bash
cd /path/to/your/project
```

2️⃣ **Ensure You Have a `sonar-project.properties` File**
Create one if missing with the following content:
```ini
sonar.projectKey=typescript-jumpstart
sonar.projectName=typescript-jumpstart
sonar.projectVersion=1.0
sonar.sourceEncoding=UTF-8

# SonarQube Server URL
sonar.host.url=http://localhost:9000
sonar.login=sqp_5fda2118f66681850e1ab2101e1c8d85f8ed7bcc

# Language
sonar.language=js
sonar.sources=src

# Test Coverage
sonar.javascript.lcov.reportPaths=test/coverage/e2e/lcov.info

# Ignore files
sonar.exclusions=**/*.spec.ts, **/node_modules/**, **/test/**

```
*Replace `YOUR_PROJECT_KEY` and `YOUR_GENERATED_TOKEN` with your actual project key and token.*

---

### **Run Tests and Generate Coverage with jest**

1. **Install jest libs for typescript** (if not already installed):
   ```bash
   npm install --save-dev jest ts-jest jest-sonar
   ```

2. **Run Your Tests with Coverage Reporting**
   In your project directory, run:
   ```bash
   npm run test:e2e
   ```
   *Replace `YOUR_MODULE` with the name of the module or package you wish to cover.*
   This command generates a `coverage.xml` file in the current directory.


3. **Verify the Coverage File**
   Ensure that the file `coverage.xml` exists in your project root.
   This file is referenced in `sonar-project.properties` via:
   ```ini
   sonar.javascript.lcov.reportPaths=test/coverage/e2e/lcov.info
   ```

4. **Run SonarScanner**
   **Using Docker:**
   ```bash
   docker run --rm \
     -e SONAR_HOST_URL="http://host.docker.internal:9000" \
     -e SONAR_TOKEN="YOUR_GENERATED_TOKEN" \
     -v "$(pwd):/usr/src" \
     sonarsource/sonar-scanner-cli
   ```
   OR 

   **Using Installed SonarScanner:**
   ```bash
   npx sonar-scanner
   ```

---

## **Viewing Analysis Results**

- Open **[http://localhost:9000](http://localhost:9000)**
- Navigate to **Projects**
- Select your project to view **code quality reports, vulnerabilities, and recommendations**.

---

##  Integrate SonarQube with CI/CD (Optional)
You can integrate SonarQube into your CI/CD pipeline in GitHub Actions, GitLab CI, or Jenkins.

GitHub Actions Example (.github/workflows/sonarqube.yml)

```yaml
name: SonarQube Analysis

on:
  push:
    branches:
      - main

jobs:
  sonar:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Run tests & coverage
        run: npm test -- --coverage

      - name: SonarQube Scanner
        run: |
          npm install -g sonarqube-scanner
          sonar-scanner
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: "http://sonarqube.yourdomain.com"
```


## **Common Issues & Troubleshooting**

### ❌ SonarScanner Cannot Connect to SonarQube
✔️ **Solution:** Use `host.docker.internal` instead of `localhost`
```bash
docker run --rm \
  -e SONAR_HOST_URL="http://host.docker.internal:9000" \
  -e SONAR_TOKEN="YOUR_GENERATED_TOKEN" \
  -v "$(pwd):/usr/src" \
  sonarsource/sonar-scanner-cli
```

### ❌ SonarQube Fails to Start
✔️ **Solution:** Increase RAM for SonarQube
```bash
docker update --memory=4g sonarqube
docker restart sonarqube
```

### ❌ Scanner Fails with `sonar-scanner.properties` Missing
✔️ **Solution:** Ensure `sonar-project.properties` exists in the project root.

---

## **Starting Docker & Managing Containers**

### **Ensuring Docker is Running**
- **On Windows/macOS:**
  Launch **Docker Desktop** from your Applications folder. Wait for Docker to initialize (you should see the Docker icon in your system tray or menu bar).

- **On Linux:**
  Check Docker status:
  ```bash
  systemctl status docker
  ```
  If Docker is not running, start it with:
  ```bash
  sudo systemctl start docker
  ```
  Or on older systems:
  ```bash
  sudo service docker start
  ```

### **Starting an Already Built Container**
If you have already built the SonarQube container and it’s stopped, follow these steps:

1. **Check the Container Status**
   ```bash
   docker ps -a | grep sonarqube
   ```
2. **Start the Existing Container**
   If the container exists but is not running:
   ```bash
   docker start sonarqube
   ```
3. **Verify the Container is Running**
   ```bash
   docker ps | grep sonarqube
   ```
4. **Access the Web UI**
   Open **[http://localhost:9000](http://localhost:9000)** in your browser.

---

## **Additional Configurations**

### **Using SonarQube with Docker Compose**
Create a `docker-compose.yml` file:
```yaml
version: "3"
services:
  sonarqube:
    image: sonarqube:latest
    container_name: sonarqube
    ports:
      - "9000:9000"
    environment:
      SONAR_ES_BOOTSTRAP_CHECKS_DISABLE: "true"
```
Run it:
```bash
docker-compose up -d
```

---

## **References**
📌 [SonarQube Official Docs](https://docs.sonarqube.org/latest/)
📌 [GitHub SonarQube Setup](https://github.com/kevit-Vishal-Parmar/sonarqube-setup/blob/main/setup/setup.md)
📌 [Medium SonarScanner Guide](https://medium.com/novai-devops-101/how-to-install-sonarscanner-cli-client-on-windows-linux-and-macos-94b033f719c4)

---

🎯 **Now you have a fully working SonarQube + SonarScanner setup, including code coverage reporting using** 🚀

**Summary**

1. Run SonarQube (locally via Docker or use SonarCloud).
2. Install SonarScanner (npm install -g sonarqube-scanner).
3. Configure Jest to generate lcov coverage reports.
4. Run tests to create coverage reports (npm test -- --coverage).
5. Create sonar-project.properties file in your project root.
6. Run SonarScanner (sonar-scanner or use Docker).
7. Check results on SonarQube UI.
8. (Optional) Integrate SonarQube in CI/CD (e.g., GitHub Actions).
