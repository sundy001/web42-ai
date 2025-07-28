You are cloud architect expert. I am trying to a build AI site generator which can generate a static React site with one line description. Just read the following project plan without reply. I will consult about the project later.

# **Project Summary: AI Site Generator Architecture**

## 1. Project Goal

To build a scalable, resilient cloud platform that generates a static React site from a single user prompt. The system provides real-time progress updates to the user and handles the entire workflow from code generation to deployment.

## 2. Core Architectural Principles

- **Decoupled Services:** The architecture is based on a microservices model where services are independent and do not call each other directly.
- **Event-Driven Communication:** Services communicate asynchronously using a message broker (Cloudflare Queues). This ensures resilience and scalability.
- **Separation of Concerns:** Each service has a single, well-defined responsibility.

## 3. Service Breakdown

### **`@web42-ai/core-api` (The Orchestrator):**

The central state manager. It initiates workflows, interacts with the database, and publishes jobs to the queues.

- The central "brain" and state manager of the application.
- Communicates directly with the MongoDB database to manage project state, versions, and task lists.
  Handles the initial, fast "Planning" AI call to generate a task list for the user.

### **`AIAppWorker` (The Context-Aware Specialist):**

A sophisticated worker responsible for executing a single step of a plan. Its primary job is to meticulously prepare the perfect context (fetching related files, parsing dependencies) for each call to the AI (Gemini). It is I/O-bound and scales out massively.

- A Context-Aware Specialist that act as an expert "prompt engineer" on the fly, meticulously preparing the perfect context for every single AI call.
- Consumes "project-builds-queue" events from a queue.
- Communicates with the AI Agent (Gemini) to get code for a specific task.
- Manages versioning by creating new snapshot directories in R2 for each checkpoint. \* Publishes "ProgressUpdate" events after each task is completed.

### **`Build Service` (The Heavy-Lifter):**

A resource-intensive service dedicated to running the `npm run build` command. It is CPU/RAM-bound and scales independently from the `AIAppWorker`.

- Consumes "project-builds-queue" events, specifying which version to build.
- Fetches the correct source code snapshot from R2, runs the build, and uploads the final static assets back to R2.

### **`@web42-ai/admin-web` (Backend-for-Frontend):**

A lightweight service that manages the Server-Sent Events (SSE) connection to the user's browser for real-time UI updates.

## 4. Data Management Strategy

- **Source Code & Artifacts:** Stored in **Cloudflare R2**. This includes versioned source code (e.g., `/v1/`, `/v2/`) and build artifacts (the `dist` folder).
- **Metadata & State:** Stored in **MongoDB**. Its document-based model is a perfect fit for the project's structure.

## 5. Final Database Schema

- **`users`:** Stores user authentication information.
- **`projects`:** The central document for a user's site. Contains the project name and references to its versions and active deployment.
- **`versions`:** A record for each point-in-time snapshot of the code, containing a pointer to the `plan` that created it and its R2 source path.
- **`plans`:** Stores every plan ever generated, including its list of steps and their live status (`pending`, `complete`, etc.). This is the source of truth for code generation progress.
- **`deployments`:** A log of every deployment attempt, containing its status, URL, and a link to the `version` it was built from.
- **`builds`:** A log of every build attempt, containing status, logs, and other build-specific metadata.
- **`threads`:** Stores the immutable chat history. User actions (like reverting) are handled via a `status` field on each message (`active` vs. `archived`) to preserve history.

## 6. Asynchronous Messaging System (Cloudflare Queues)

The system relies on six queues to manage workflows:

| Queue Name                  | Producer             | Consumer              | Purpose                                                |
| :-------------------------- | :------------------- | :-------------------- | :----------------------------------------------------- |
| `plan-steps-queue`          | `@web42-ai/core-api` | `AIAppWorker`         | Holds the code generation tasks for the AI worker.     |
| `project-builds-queue`      | `@web42-ai/core-api` | `Build Service`       | Triggers a new build job.                              |
| `step-status-to-bff-queue`  | `AIAppWorker`        | `@web42-ai/admin-web` | Fans out real-time code generation progress to the UI. |
| `step-status-to-db-queue`   | `AIAppWorker`        | `@web42-ai/core-api`  | Fans out code generation progress for persistence.     |
| `build-status-to-bff-queue` | `Build Service`      | `@web42-ai/admin-web` | Fans out real-time build progress to the UI.           |
| `build-status-to-db-queue`  | `Build Service`      | `@web42-ai/core-api`  | Fans out build progress for persistence.               |

## 7. Development Environment

- A **monorepo** structure is used to manage all services and shared packages.
- **Turborepo** is layered on top as the high-level task orchestrator for its intelligent caching and pipeline management.
- **Bun** is used as the underlying toolkit (runtime, package manager, bundler) for maximum performance.

## 8. Key Design Decisions & Rationale

- **Services are fully decoupled.** They do not call each other directly. Instead, they communicate asynchronously using Cloudflare Queues.
- **`AIAppWorker` and `Build Service` are separate** because they have fundamentally different resource profiles (I/O-bound vs. CPU-bound), scaling needs, and failure modes. Merging them would be inefficient and create a brittle monolith.
- **`Plans` and `Deployments` are separate collections** (not embedded in `projects`) to keep the main `projects` document lean and to correctly model one-to-many relationships (e.g., one version can have multiple deployment attempts).
- **Conversation history is "soft deleted"** by changing a message's status, preserving a complete audit trail and allowing for version-reverting functionality.
- **The system handles build failures** by treating them as events that can trigger a new "corrective plan" from the AI, creating a resilient, self-healing loop.
- **Source Code Storage is in R2 and MongoDB.** AI-generated source code is stored in Cloudflare R2. The MongoDB database only stores metadata and a pointer to the code's location in R2.
- **Versioning: Implemented via a "Snapshot Directory Model" on R2.** Each user checkpoint creates a full copy of the source code in a new versioned directory (e.g., /v1/, /v2/). This was chosen over a complex Git-based model for its simplicity and speed of implementation.
- **We will not store snapshots of the build files.** To ensure reliability and security, projects are always rebuilt on-demand from the source code snapshot when a user jumps to a previous version.
- **Projects are not run on a server.** They are static sites served directly from R2 via the Cloudflare CDN. A "deployment" is simply an API call to update a subdomain's DNS record to point to the correct build directory in R2.
- **The feature to compare two snapshots** is handled by a dedicated API endpoint in the MainBackend. It fetches files from R2, performs the diff on the server, and sends a small JSON patch to the frontend for rendering.

## 9. Database Schema

### users

```json
{
  "_id": "user_abc",
  "email": "user@example.com",
  "name": "Jane Doe",
  "authProvider": "google", // or email, etc.
  "createdAt": "2023-10-27T09:00:00Z"
}
```

### projects

```json
{
  "_id": "project_123",
  "userId": "user_abc",
  "name": "My Math Test App",
  "activeDeployment": {
    // Information about the live site
    "deploymentId": "deploy_xyz",
    "url": "math-test-app.yourdomain.com",
    "versionId": 1 // Which version is currently live
  },
  "versions": [
    {
      "versionId": 1,
      "planId": "plan_abc", // <-- KEY: Pointer to the plan for v1
      "deploymentIds": ["..."],
      "triggeringMessageId": "msg_01"
    },
    {
      "versionId": 2,
      "planId": "plan_xyz", // <-- KEY: Pointer to the plan for v2
      "deploymentIds": ["..."],
      "triggeringMessageId": "msg_03"
    }
  ]
  "createdAt": "2023-10-27T10:00:00Z"
}
```

### Plan

```json
{
  "_id": "plan_abc", // Plan for Version 1
  "projectId": "project_123",

  "taskTitle": "Add new Feature",
  "status": "complete", // 'pending', 'in_progress', 'complete', 'failed'
  "tasks": [
    {
        "taskId": "...",
        "title": "Editing PlanSelector component",
        "subtitle": "PlanSelector component",
        "description": "...",
        "status": "complete"
    },
  ],
  "createdAt": "..."
},
```

### threads

```json
{
  "_id": "thread_abc",
  "projectId": "project_123",
  "messages": [
    {
      "messageId": "msg_01",
      "role": "user",
      "contentType": "text", // The user sent plain text
      "content": "Make me a site to test math skills",
      "createdAt": "2023-10-27T10:01:00Z"
    },
    {
      "messageId": "msg_02",
      "role": "ai",
      "contentType": "plan_reference", // CRITICAL: This tells the UI what to do
      "content": {
        "initialText": "Of course! I've created a plan to build your site. Here are the steps:",
        "plainId" "plan_abc"
      },
      "status": "archived",
      "createdAt": "2023-10-27T10:02:00Z"
    }
  ]
}
```

### deployment

```json
{
  "_id": "deploy_xyz_prod",
  "projectId": "project_123",
  "versionId": 2, // Which version (blueprint) was used
  "status": "live", // 'pending', 'building', 'live', 'failed', 'archived'
  "url": "my-app.yourdomain.com",
  "r2Path_artifacts": "/builds/deploy_xyz_prod/dist/", // Path to the built files
  "logs": "...",
  "createdAt": "..."
}
```
