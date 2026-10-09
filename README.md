# 🎵 Spotify AI Memory System (https://spotify-ai-memory-1.onrender.com)

### An AI-Powered Personalized Memory and Retrieval Platform

A collaborative AI project designed to store, organize, retrieve, and manage personalized memories using artificial intelligence. The system combines a React frontend, FastAPI backend, graph-based user data storage, relational interaction storage, and Google's Gemini AI to provide an interactive memory management experience.

**Built as a Group Project**

---

## 📌 Table of Contents

1. [Project Overview](#-project-overview)
2. [Problem Statement](#-problem-statement)
3. [Project Objectives](#-project-objectives)
4. [Key Features](#-key-features)
5. [Technology Stack](#-technology-stack)
6. [System Architecture](#-system-architecture)
7. [Application Workflow](#-application-workflow)
8. [Project Structure](#-project-structure)
9. [Prerequisites](#-prerequisites)
10. [Installation and Setup](#-installation-and-setup)
11. [Environment Variables](#-environment-variables)
12. [Running the Application](#-running-the-application)
13. [Application Modules](#-application-modules)
14. [API Documentation](#-api-documentation)
15. [Database Architecture](#-database-architecture)
16. [Authentication and Authorization](#-authentication-and-authorization)
17. [Deployment](#-deployment)
18. [Testing and Validation](#-testing-and-validation)
19. [Group Project Contributions](#-group-project-contributions)
20. [Future Enhancements](#-future-enhancements)
21. [Troubleshooting](#-troubleshooting)
22. [Contributing](#-contributing)
23. [License](#-license)

---

## 🚀 Project Overview

Spotify AI Memory System is an AI-powered application focused on personalized memory management and intelligent information retrieval.

The application provides an interface for users to save memories, manage stored information, search relevant records, and interact with an AI assistant. It also includes administrative functionality for monitoring registered users and recorded interactions.

The project combines a modern web interface with a Python backend, database integrations, authentication, and generative AI capabilities.

### What does the application do?

* Allows users to create and manage personal memories.
* Organizes memories into meaningful categories.
* Supports memory searching and retrieval.
* Provides an AI-powered question-and-answer interface.
* Uses a generative AI model to support intelligent responses.
* Maintains user and interaction data across integrated databases.
* Provides administrator-only views for user management and interaction monitoring.

### Project Information

| Attribute            | Details                                                                      |
| -------------------- | ---------------------------------------------------------------------------- |
| Project Name         | Spotify AI Memory System                                                     |
| Project Type         | Full-Stack AI Application                                                    |
| Development Approach | Collaborative Group Project                                                  |
| Frontend             | React.js and Vite                                                            |
| Backend              | Python and FastAPI                                                           |
| Graph Database       | Neo4j                                                                        |
| Relational Database  | PostgreSQL                                                                   |
| AI Integration       | Google Gemini                                                                |
| Authentication       | JWT-based authentication                                                     |
| Repository           | [GitHub Repository](https://github.com/meshivammishra/spotify-ai-memory.git) |

---

## 🎯 Problem Statement

Personalized applications can accumulate different types of information, including user preferences, historical interactions, and personal context.

Managing this information manually can make it difficult to find relevant details and provide personalized responses.

The objective of this project is to develop an application that organizes user memories, supports efficient retrieval, and uses AI to make stored information more useful.

The application also provides a centralized interface for managing memories and monitoring application activity.

---

## 🎯 Project Objectives

The primary objectives are:

1. **Personalized Memory Management:** Provide a structured way to create, view, update, and delete memories.
2. **Intelligent Retrieval:** Help users locate relevant information through memory search.
3. **AI-Assisted Interaction:** Integrate a generative AI model for conversational responses.
4. **Structured Data Management:** Use appropriate databases for user information and interaction records.
5. **Secure Authentication:** Protect application resources using authenticated access.
6. **Role-Based Administration:** Restrict administrative functionality to authorized users.
7. **Modular Architecture:** Separate frontend, backend, database, and AI responsibilities.
8. **Collaborative Development:** Maintain a codebase that can be developed and extended by multiple contributors.

---

## ✨ Key Features

### 1. User Authentication

* User registration and login.
* JWT-based authentication.
* Authenticated API requests.
* Current-user verification.
* Administrator access based on configured user identity.

### 2. Memory Management

Users can manage their stored memories through the web interface.

The memory management functionality includes:

* Creating memories.
* Viewing saved memories.
* Editing existing memories.
* Deleting memories.
* Organizing information for future retrieval.

### 3. Memory Categorization

The backend includes memory classification logic for the following categories:

| Memory Type | Purpose                         |
| ----------- | ------------------------------- |
| Personal    | Personal facts and information  |
| Preference  | User preferences and likes      |
| Episodic    | Experiences and specific events |

These categories help organize information according to its intended purpose.

### 4. Memory Search

The application includes a memory search interface that communicates with the backend to retrieve relevant stored information.

The search workflow connects the user interface, backend retrieval logic, and stored memory data.

### 5. Ask AI

The Ask AI module provides an interface for submitting questions and receiving AI-assisted responses.

The intended workflow combines the user's question, relevant application context, and the configured Gemini integration.

The quality of the response depends on the retrieved context, model configuration, and availability of the AI service.

### 6. Dashboard

The dashboard provides a central interface for accessing the application's primary features.

It connects the navigation interface with the memory management and AI interaction modules.

### 7. Admin Dashboard

The administrative interface includes:

* **User Management:** View registered users.
* **Interaction Monitoring:** Review recorded interactions.
* **Access Control:** Display the current user's administrative role.

The administrative API endpoints enforce authorization on the backend.

### 8. Database Integration

The application integrates multiple data storage technologies:

* Neo4j for graph-based user information and related operations.
* PostgreSQL for relational records, including interaction data.
* Application-level retrieval and AI logic for processing information.

---

## 🛠️ Technology Stack

### Frontend

| Technology | Purpose                                          |
| ---------- | ------------------------------------------------ |
| React.js   | Component-based user interface                   |
| Vite       | Frontend development server and production build |
| JavaScript | Application logic                                |
| CSS        | Styling and responsive interface                 |
| Fetch API  | Communication with backend endpoints             |

### Backend

| Technology                       | Purpose                      |
| -------------------------------- | ---------------------------- |
| Python                           | Backend programming language |
| FastAPI                          | REST API development         |
| Uvicorn                          | ASGI application server      |
| SQLAlchemy                       | Relational database access   |
| PyJWT-compatible JWT integration | Token-based authentication   |
| Neo4j Python Driver              | Neo4j database connectivity  |

### AI and Data

| Technology           | Purpose                                  |
| -------------------- | ---------------------------------------- |
| Google Gemini        | Generative AI integration                |
| Embedding components | Support for embedding-related operations |
| Neo4j                | Graph-based data storage                 |
| PostgreSQL           | Relational data storage                  |

### Development and Deployment

* Git
* GitHub
* Visual Studio Code
* Node.js and npm
* Python virtual environment
* Render

---

## 🏗️ System Architecture

The application follows a modular full-stack architecture.

```text
                    ┌───────────────────────────┐
                    │         User               │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │      React Frontend        │
                    │                           │
                    │  Dashboard                │
                    │  Memories                 │
                    │  Ask AI                   │
                    │  Admin Dashboard          │
                    └─────────────┬─────────────┘
                                  │
                                  │ HTTP / REST API
                                  ▼
                    ┌───────────────────────────┐
                    │       FastAPI Backend      │
                    │                           │
                    │  Authentication           │
                    │  Memory Management        │
                    │  Memory Search            │
                    │  AI Integration            │
                    │  User Management           │
                    │  Interaction Monitoring    │
                    └──────┬────────┬───────────┘
                           │        │
                ┌──────────┘        └──────────┐
                ▼                              ▼
       ┌──────────────────┐          ┌──────────────────┐
       │      Neo4j       │          │   PostgreSQL     │
       │                  │          │                  │
       │ User information │          │ Interaction data │
       │ Graph operations │          │ Relational data  │
       └──────────────────┘          └──────────────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │   Google Gemini    │
                 │                    │
                 │ AI-assisted        │
                 │ responses          │
                 └────────────────────┘
```

**Note:** This diagram represents the application's logical architecture. The exact request path and data flow depend on the implementation of each backend module.

---

## 🔄 Application Workflow

### Step 1: User Authentication

The user registers or logs in through the React frontend.

The frontend sends the authentication request to the FastAPI backend. After successful authentication, the application uses the returned authentication information for subsequent protected requests.

### Step 2: User Verification

The frontend can request the current user's information through the `/auth/me` endpoint.

The backend validates the authentication token and retrieves the corresponding user record.

The response includes the user's identity and administrative status.

### Step 3: Memory Management

When a user creates or updates a memory:

1. The frontend collects the memory information.
2. The frontend sends a request to the backend.
3. The backend validates the request and authenticated user.
4. The relevant memory-processing logic runs.
5. The memory is stored or updated using the configured storage layer.
6. The frontend displays the result.

### Step 4: Memory Search

1. The user enters a search query.
2. The frontend sends the query to the backend.
3. The backend executes the implemented retrieval logic.
4. The retrieved information is returned to the frontend.
5. The user views the results.

### Step 5: Ask AI

1. The user submits a question.
2. The frontend sends the question to the backend.
3. The backend executes the configured AI request workflow.
4. Relevant context is used where supported by the implementation.
5. The Gemini integration generates an AI-assisted response.
6. The response is displayed in the frontend.

### Step 6: Administrative Operations

1. An administrator logs in.
2. The frontend identifies the administrator's role.
3. The administrator opens the Admin Dashboard.
4. The backend validates administrator authorization for protected endpoints.
5. The application retrieves registered users or recorded interactions.
6. The frontend displays the corresponding records.

---

## 📂 Project Structure

The repository is organized into frontend, backend, data, and embedding-related directories.

```text
spotify-ai-memory/
│
├── backend/
│   ├── main.py
│   │
│   └── routers/
│       ├── __init__.py
│       ├── auth.py
│       ├── interactions.py
│       ├── memories.py
│       └── users.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Memories.jsx
│   │   ├── AskAI.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── api.js
│   │   └── App.css
│   │
│   ├── package.json
│   └── ...
│
├── data/
├── embeddings/
│
├── .gitignore
├── .python-version
├── requirements.txt
└── README.md
```

*The tree highlights the main files and directories. Additional files may exist in the repository.*

### Important Backend Files

| File                              | Responsibility                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `backend/main.py`                 | Main FastAPI application, application configuration, authentication dependencies, and router registration |
| `backend/routers/auth.py`         | Authentication-related API routes                                                                         |
| `backend/routers/memories.py`     | Memory-related API routes                                                                                 |
| `backend/routers/users.py`        | User-related API routes and administrative user operations                                                |
| `backend/routers/interactions.py` | Interaction recording and retrieval endpoints                                                             |

### Important Frontend Files

| File                              | Responsibility                                                       |
| --------------------------------- | -------------------------------------------------------------------- |
| `frontend/src/App.jsx`            | Main application component, authentication flow, and page navigation |
| `frontend/src/Sidebar.jsx`        | Navigation sidebar and conditional admin menu                        |
| `frontend/src/Dashboard.jsx`      | Main dashboard interface                                             |
| `frontend/src/Memories.jsx`       | Memory management interface                                          |
| `frontend/src/AskAI.jsx`          | AI question-and-answer interface                                     |
| `frontend/src/AdminDashboard.jsx` | Administrative interface for users and interactions                  |
| `frontend/src/api.js`             | Frontend API requests and response handling                          |
| `frontend/src/App.css`            | Application styling                                                  |

### Supporting Directories

| Directory     | Purpose                                           |
| ------------- | ------------------------------------------------- |
| `data/`       | Data-related project resources                    |
| `embeddings/` | Embedding-related project components or resources |
| `frontend/`   | React application                                 |
| `backend/`    | Python API application                            |

---

## 💻 Prerequisites

Install the following before running the project:

* Python compatible with the project's dependencies.
* Node.js and npm.
* Git.
* A configured Neo4j database.
* A configured PostgreSQL database.
* A Google Gemini API key.
* A configured JWT secret.

You should also have access to the database credentials and application configuration required by the project.

---

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/meshivammishra/spotify-ai-memory.git
```

Navigate to the project directory:

```bash
cd spotify-ai-memory
```

### 2. Create a Python Virtual Environment

On Windows PowerShell:

```powershell
python -m venv venv
```

Activate it:

```powershell
.\venv\Scripts\Activate.ps1
```

If PowerShell blocks script execution, you can temporarily adjust the execution policy for the current terminal session:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

Then activate the virtual environment again.

### 3. Install Backend Dependencies

From the project root:

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Install Frontend Dependencies

```powershell
cd frontend
npm install
```

Return to the project root when needed:

```powershell
cd ..
```

---

## 🔐 Environment Variables

The backend requires configuration for its database connections, AI integration, and authentication.

Create or update the environment configuration file used by the backend. In a local setup that loads a root-level `.env` file, it can be placed in the project root.

Use the following variable names as a starting point:

```dotenv
# Neo4j
NEO4J_URI=your_neo4j_uri
NEO4J_USERNAME=your_neo4j_username
NEO4J_PASSWORD=your_neo4j_password

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# JWT authentication
JWT_SECRET_KEY=replace_with_a_strong_random_secret

# Administrator configuration
ADMIN_USER_ID=your_admin_user_id
```

Configure the PostgreSQL variables expected by the project's database configuration as well.

**Important:**

* Replace every placeholder with your own configuration.
* Never commit `.env` files or credentials to GitHub.
* Use a strong, randomly generated JWT secret.
* Configure the required variables in the deployment platform's environment settings.
* The `ADMIN_USER_ID` must match the intended administrator's actual user ID.
* An administrator configured locally is not automatically configured in production.

The variable names above reflect the application's known configuration. Check the database configuration module for the exact PostgreSQL variable names and required values.

---

## ▶️ Running the Application

The backend and frontend run in separate terminals during local development.

### Terminal 1: Start the Backend

Open PowerShell at the project root:

```powershell
cd backend
```

Activate the virtual environment if it is not already active:

```powershell
..\venv\Scripts\Activate.ps1
```

Start the FastAPI application:

```powershell
python -m uvicorn main:app --reload --port 8000
```

The API should be available at:

```text
http://127.0.0.1:8000
```

Open the interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

**Note:** The backend command uses `main:app` from inside the `backend` directory because the application's imports are organized for that working directory.

### Terminal 2: Start the Frontend

Open another terminal:

```powershell
cd frontend
```

Start Vite:

```powershell
npm run dev
```

Open the local application using the URL printed by Vite. The default is:

```text
http://localhost:5173
```

### Build the Frontend for Production

From the `frontend` directory:

```powershell
npm run build
```

Vite generates the production frontend build in the `frontend/dist/` directory.

---

## 🧩 Application Modules

### Authentication Module

Responsible for user authentication, token validation, and retrieving the current authenticated user.

### Memory Module

Responsible for memory-related API operations and the corresponding frontend interface.

### Search Module

Connects the frontend search interface to the backend's memory retrieval logic.

### AI Module

Connects the application to the configured Gemini integration and supports AI-assisted responses.

### User Module

Provides user-related API operations and supports administrative user listing.

### Interaction Module

Handles the recording and retrieval of interaction data through the configured relational storage layer.

### Administration Module

Combines the administrative frontend interface with backend-protected user and interaction endpoints.

---

## 🔌 API Documentation

The FastAPI backend provides API endpoints for authentication, memory operations, user management, and interaction handling.

The most reliable way to inspect the complete list of available routes, request schemas, and response formats is to open the interactive Swagger documentation.

### Local API Documentation

```text
http://127.0.0.1:8000/docs
```

### Known API Endpoints

| Endpoint                  | Method | Purpose                                                                                 |
| ------------------------- | ------ | --------------------------------------------------------------------------------------- |
| `/auth/me`                | GET    | Retrieve the current authenticated user's information                                   |
| `/users`                  | GET    | Retrieve registered users; requires administrator authorization                         |
| `/users`                  | POST   | Create a user through the configured user API                                           |
| `/interactions`           | GET    | Retrieve recorded interactions; requires administrator authorization                    |
| `/interactions/{user_id}` | GET    | Retrieve interactions for a user, subject to access control                             |
| `/v1/events`              | POST   | Record an interaction subject to the endpoint's authentication and consent requirements |

The memory and authentication routers expose additional routes. Their exact paths and methods should be inspected through `/docs`.

**Security note:** Protected endpoints require the appropriate authentication token and authorization. Never assume that hiding a frontend button is sufficient to protect an API endpoint.

---

## 🗄️ Database Architecture

The application uses different database technologies for different types of data.

### Neo4j

Neo4j provides graph-based storage and access for user-related information and associated application operations.

The backend connects through the Neo4j Python driver.

### PostgreSQL

PostgreSQL provides relational data storage, including interaction records managed through the application's SQLAlchemy integration.

### Why Use Multiple Databases?

Different storage technologies can support different application requirements:

* Graph storage supports relationships between entities.
* Relational storage supports structured records and database queries.
* The backend coordinates application operations across the configured storage layers.

The exact ownership of individual data entities is determined by the implementation of the relevant backend modules.

---

## 🔒 Authentication and Authorization

The application uses JWT-based authentication to identify users making protected API requests.

The backend validates the token and extracts the authenticated user's identifier.

Administrative access is checked against the configured administrator identity.

### Authorization Principles

* Users must authenticate before accessing protected endpoints.
* Administrative endpoints must enforce authorization on the backend.
* The administrator identity must be configured correctly.
* Sensitive configuration must be stored outside the source code.
* Production environment variables must be configured independently of local development.

The frontend can conditionally display administrative navigation, but the backend remains responsible for enforcing access restrictions.

---

## ☁️ Deployment

The project has been configured for deployment through Render.

The repository's production branch is `master`.

### Deployment Workflow

1. Commit and push the intended changes to the configured GitHub branch.
2. Confirm that Render is monitoring the correct repository and branch.
3. Verify the build and start commands.
4. Configure all required production environment variables.
5. Check the deployment logs for build or startup failures.
6. Confirm that the deployment reaches the `Live` state.
7. Test authentication, memory operations, search, AI responses, and administrative endpoints on the deployed application.

### Production Configuration Checklist

* [ ] Correct GitHub repository connected.
* [ ] Correct deployment branch selected.
* [ ] Frontend production build succeeds.
* [ ] Backend starts successfully.
* [ ] Neo4j connection succeeds.
* [ ] PostgreSQL connection succeeds.
* [ ] Gemini API configuration is valid.
* [ ] JWT secret is configured.
* [ ] `ADMIN_USER_ID` is configured.
* [ ] Frontend API requests reach the deployed backend.
* [ ] Protected endpoints enforce authorization.
* [ ] Live application functionality has been tested.

**Deployment note:** The exact Render build command, start command, and frontend-serving configuration depend on the service settings. Verify these settings before changing production deployment configuration.

---

## 🧪 Testing and Validation

Use the following checklist when validating changes.

### Frontend

* [ ] Application loads successfully.
* [ ] Login and registration work.
* [ ] Dashboard navigation works.
* [ ] Memories can be created, edited, and deleted.
* [ ] Memory search returns the expected response.
* [ ] Ask AI displays responses and errors appropriately.
* [ ] Admin Dashboard displays only for authorized users.

### Backend

* [ ] Application starts without import errors.
* [ ] Database connections initialize successfully.
* [ ] Authentication token validation works.
* [ ] Memory endpoints handle requests correctly.
* [ ] Search requests return expected responses.
* [ ] AI requests handle success and failure cases.
* [ ] Unauthorized requests to admin endpoints are rejected.

### Deployment

* [ ] Production build completes successfully.
* [ ] Required environment variables are configured.
* [ ] Application starts successfully on Render.
* [ ] Live API endpoints respond as expected.
* [ ] Admin access is verified independently of frontend visibility.

---

## 👥 Group Project Contributions

This project was developed collaboratively.

Use this section to document the actual contributions of every group member. Update the placeholders before publishing the final README.

## Contributors
1. Mansi Srivastava - [Project Explanation video] (https://drive.google.com/file/d/1thJDxjCs0g_0Hz5AvGjSiTIuO3J28Iii/view?usp=sharing)
2. Jatin Kumar - video link (https://drive.google.com/file/d/15YEH5WhAvn12GBxsF0RBuHJqFBnsfMA3/view?usp=sharing)
3. B. Harsha Sai - colab link (https://colab.research.google.com/drive/1mnm4CNY3ERfQZMAiWi4aJQDASfRpa4j5?usp=drive_link)
4. Deep Sarkar - video link ( https://drive.google.com/file/d/1m7F3PM1c5zjYKuOzsi8CUPLUYXwAmvSZ/view?usp=sharing )
5. Shivam Mishra - Video_Link (  https://drive.google.com/file/d/13DTm2OXPr8f1jckPutfqJjzDMbFau6cM/view?usp=sharing  )
6. Aryan Gupta - video link ( https://drive.google.com/file/d/1WMWmS4PLZvuNvTpDqpoEj5uT5Lt_urmF/view?usp=sharing )
7. Anju khedar - video link (https://drive.google.com/file/d/1VmffWvHyzas4RHhxLgiaoIENIq4QHzZ6/view?usp=sharing

### Suggested Areas of Responsibility

Assign these areas only where they reflect the team's actual work.

* **Frontend Development:** React components, navigation, styling, and API integration.
* **Backend Development:** FastAPI endpoints, application logic, and router organization.
* **AI Integration:** Gemini integration, prompt construction, and retrieval-related workflows.
* **Database Management:** Neo4j, PostgreSQL, data modeling, and persistence.
* **Authentication and Security:** JWT validation, administrator authorization, and access control.
* **Testing and Deployment:** Functional testing, GitHub collaboration, deployment configuration, and documentation.

### Collaboration Workflow

The team can use the following workflow for future changes:

1. Create a feature branch.
2. Implement a focused change.
3. Test the change locally.
4. Review the code and relevant diffs.
5. Commit the changes with a descriptive message.
6. Push the feature branch to GitHub.
7. Review and merge the change into the production branch after validation.

---

## 🚀 Future Enhancements

Potential improvements include:

* Improve memory retrieval accuracy and relevance.
* Strengthen synchronization between retrieved context and AI responses.
* Improve error handling for AI API failures and quota limits.
* Add automated backend and frontend tests.
* Improve the search interface and result presentation.
* Add more comprehensive administrative analytics.
* Improve memory classification and categorization.
* Expand application monitoring and logging.
* Document the API request and response schemas.
* Improve deployment automation and production validation.

These items are potential future improvements, not claims that the functionality is already implemented.

---

## 🛠️ Troubleshooting

### 1. `ModuleNotFoundError: No module named 'database'`

**Cause:** The backend may be started from the project root even though its imports expect the `backend` directory to be the working directory.

**Solution:**

```powershell
cd backend
python -m uvicorn main:app --reload --port 8000
```

### 2. Neo4j Connection Failure

Check:

* `NEO4J_URI`
* `NEO4J_USERNAME`
* `NEO4J_PASSWORD`
* Database availability.
* Network and TLS configuration.

Do not print or share passwords when troubleshooting.

### 3. Missing Environment Variables

If the backend reports that a required configuration variable is missing:

1. Verify that the environment configuration file is in the expected location.
2. Confirm that the application loads that file.
3. Check that the variable names match the backend configuration.
4. Restart the backend after making configuration changes.

### 4. Admin Dashboard Is Not Visible

Verify:

* The current user is authenticated.
* The `/auth/me` endpoint returns the expected user identity.
* `ADMIN_USER_ID` matches the intended administrator's ID.
* The backend and frontend are running the expected code version.

### 5. Admin API Returns `403 Forbidden`

The authenticated user's ID may not match the configured administrator ID.

Check the configuration and user identity without sharing credentials or tokens.

### 6. Admin API Returns `503 Service Unavailable`

The administrator identity may not be configured in the backend environment.

Check the `ADMIN_USER_ID` environment variable in the environment where the application is running.

### 7. Frontend API Requests Fail After Deployment

Check:

* The frontend API base URL.
* The deployed backend URL or same-origin routing configuration.
* CORS configuration, where applicable.
* Backend service status.
* Browser developer tools and deployment logs.

### 8. Gemini Request Fails

Check:

* Whether the Gemini API key is configured.
* Whether the selected model is available to the configured account.
* Whether the request is being rejected because of quota or rate limits.
* Whether the backend handles the provider error appropriately.

---

## 🤝 Contributing

Contributions from group members and collaborators are welcome.

Before submitting changes:

1. Keep changes focused and easy to review.
2. Avoid committing secrets or local environment files.
3. Test the affected functionality.
4. Use descriptive commit messages.
5. Document important configuration changes.
6. Verify that existing functionality continues to work.

For larger changes, use a feature branch and review the changes before merging them into `master`.

---

## 📄 License

Add the project's selected license here before distributing the repository.

If the team chooses the MIT License, include a `LICENSE` file containing the appropriate license text.

Until a license is selected and added, do not assume that the repository is MIT-licensed or that unrestricted reuse is permitted.

---

## 🙌 Acknowledgements

This project brings together frontend development, backend engineering, database integration, and generative AI to explore personalized memory management and intelligent information retrieval.

Thank you to all group members and contributors who have participated in designing, developing, testing, and improving the application.

---

**Repository:** [spotify-ai-memory](https://github.com/meshivammishra/spotify-ai-memory)

**Project Type:** Collaborative Full-Stack AI Application
