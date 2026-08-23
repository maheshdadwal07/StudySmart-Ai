# Recommended Synopsis Diagrams for StudySmart AI

The following diagrams should be created and included in your final academic synopsis to visually support the textual content. They accurately reflect the current implementation while explicitly indicating planned modules.

### 1. System Architecture (High-Level Design) Diagram
*   **Placement:** Under Section 4.1 (System Architecture)
*   **Purpose:** To illustrate the overall client-server architecture, the separation of concerns, and interactions with external cloud services and APIs.
*   **Components to Include:**
    *   **Client Layer:** React.js / Vite Frontend (UI, Upload Forms, Quiz Interface `[Planned]`).
    *   **Server Layer:** FastAPI Backend (Auth Router, Document Router, AI Generation Router `[Planned]`).
    *   **Processing Layer:** Background Task Engine, Document Parsers (`pypdf`, `python-docx`).
    *   **Data & Storage Layer:** MongoDB Atlas (NoSQL Database), Cloudinary (Cloud File Storage).
    *   **External APIs:** OpenAI or Gemini API `[Planned]`.

### 2. System Workflow Diagram
*   **Placement:** Under Section 4.2 (End-to-End System Workflow)
*   **Purpose:** To show the chronological, step-by-step flow of how the system processes a document from upload to final quiz generation.
*   **Steps to Include:**
    1.  User Uploads Document (PDF/DOCX).
    2.  Backend Validates File & Uploads to Cloudinary.
    3.  Background task extracts text from the document.
    4.  Extracted text is saved to MongoDB (Status: Processed).
    5.  Backend constructs an AI prompt and queries the LLM API `[Planned]`.
    6.  System receives and parses structured questions `[Planned]`.
    7.  User attempts the interactive quiz and receives a score `[Planned]`.

### 3. Data Flow Diagram (DFD) – Level 0 & Level 1
*   **Placement:** After Section 4.2 or within Section 4.5 (Data Management)
*   **Purpose:** To map how specific data payloads (files, extracted text, AI prompts) move between processes and data stores.
*   **Components to Include:**
    *   **External Entities:** User, AI/LLM Provider `[Planned]`.
    *   **Processes:** Authenticate User, Store Document, Extract Text, Generate Questions `[Planned]`, Evaluate Quiz `[Planned]`.
    *   **Data Stores:** Users Collection, Documents Collection, Questions Collection `[Planned]`, Quiz Results Collection `[Planned]`.
    *   **Data Flows:** Raw File, File URL, Extracted Text, User Preferences (Difficulty/Type), Prompts, Structured Questions JSON, User Answers, Score.

### 4. Use Case Diagram
*   **Placement:** Under Section 3.7 (Target Users / Use Cases)
*   **Purpose:** To define the system functionalities available to the primary actors.
*   **Components to Include:**
    *   **Actors:** User (representing Student, Teacher, Professional).
    *   **Use Cases:** Register/Login, Upload Document, View Uploaded Documents, Delete Document, Generate Quiz `[Planned]`, Take Quiz `[Planned]`, View Past Results `[Planned]`, Download Questions `[Planned]`.

### 5. Entity-Relationship (ER) / Data Model Diagram
*   **Placement:** Under Section 4.5 (Data Management)
*   **Purpose:** To detail the NoSQL document schemas and the logical relationships (via ObjectIds) between entities in MongoDB Atlas.
*   **Entities & Fields to Include:**
    *   **User:** `_id`, `email`, `hashed_password`, `full_name`, `created_at`.
    *   **Document:** `_id`, `user_id` (Reference to User), `filename`, `file_type`, `storage` (provider, public_id, secure_url), `status` (Pending, Processing, Processed, Failed), `extracted_text`, `processing_metadata`.
    *   **Question** `[Planned]`**:** `_id`, `document_id` (Reference to Document), `type` (MCQ, Short Answer, etc.), `difficulty`, `question_text`, `options` (Array for MCQs), `correct_answer`.
    *   **QuizAttempt** `[Planned]`**:** `_id`, `user_id`, `document_id`, `score`, `total_questions`, `attempted_at`.

---

# Mermaid Diagram Codes

## 1. System Architecture / HLD

```mermaid
flowchart TD
    classDef planned fill:#f9f,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5;
    classDef implemented fill:#bbf,stroke:#333,stroke-width:2px;
    classDef database fill:#fbb,stroke:#333,stroke-width:2px;
    classDef external fill:#bfb,stroke:#333,stroke-width:2px;

    User[User] --> Frontend
    
    subgraph ClientLayer [Client Layer]
        Frontend[React.js / Vite Frontend]:::implemented
        QuizUI[Interactive Quiz UI]:::planned
        Frontend -.-> QuizUI
    end
    
    ClientLayer -->|REST API| Backend
    
    subgraph ServerLayer [Server Layer: FastAPI Backend]
        Auth[Auth Router]:::implemented
        DocRouter[Document Router]:::implemented
        AIRouter[AI Generation Router]:::planned
    end
    
    Backend[FastAPI Application] -->|Background Tasks| ProcessingLayer
    
    subgraph ProcessingLayer [Processing Layer]
        PDFParser[pypdf Parser]:::implemented
        DocxParser[python-docx Parser]:::implemented
    end
    
    Backend -->|Store Metadata| MongoDB[(MongoDB Atlas)]:::database
    Backend -->|Upload Files| Cloudinary[(Cloudinary)]:::database
    ServerLayer -.->|API Request| LLM[OpenAI / Gemini API]:::external
    
    LLM -.->|Generated JSON| ServerLayer
```

## 2. End-to-End System Workflow

```mermaid
flowchart TD
    classDef planned fill:#f9f,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5;
    classDef implemented fill:#bbf,stroke:#333,stroke-width:2px;
    classDef error fill:#f66,stroke:#333,stroke-width:2px;

    A[User Login]:::implemented --> B[Upload Document]:::implemented
    B --> C{File Valid?}:::implemented
    
    C -->|No| E[Validation Error]:::error
    C -->|Yes| D[Cloudinary Storage]:::implemented
    
    D --> F[Save Metadata to MongoDB]:::implemented
    F --> G[Background Processing]:::implemented
    G --> H[Text Extraction]:::implemented
    
    H --> I{Extraction Successful?}:::implemented
    I -->|No| J[Failed Processing Status]:::error
    I -->|Yes| K[Text Validation & DB Update]:::implemented
    
    K -.-> L[AI/LLM Analysis]:::planned
    L -.-> M[Question Generation]:::planned
    M -.-> N[Question Display]:::planned
    N -.-> O[Quiz / Test]:::planned
    O -.-> P[Evaluation / Score]:::planned
    P -.-> Q[Save / Download Results]:::planned
```

## 3. DFD Level 0

```mermaid
flowchart LR
    classDef planned fill:#f9f,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5;
    classDef external fill:#bfb,stroke:#333,stroke-width:2px;
    classDef process fill:#bbf,stroke:#333,stroke-width:2px;

    User([User]):::external
    System((StudySmart AI System)):::process
    LLM([AI/LLM API]):::planned
    
    User -- "Login Credentials, Document, User Preferences" --> System
    System -- "Generated Questions, Quiz, Results, Saved Material" --> User
    
    System -. "Extracted Text, Prompts" .-> LLM
    LLM -. "Structured Questions" .-> System
```

## 4. DFD Level 1

```mermaid
flowchart TD
    classDef planned fill:#f9f,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5;
    classDef external fill:#bfb,stroke:#333,stroke-width:2px;
    classDef process fill:#bbf,stroke:#333,stroke-width:2px;
    classDef datastore fill:#fbb,stroke:#333,stroke-width:2px;

    User([User]):::external
    LLM([AI/LLM API]):::planned
    
    P1((1. Authentication)):::process
    P2((2. Document Upload & Validation)):::process
    P3((3. Document Processing & Extraction)):::process
    P4((4. Question Generation)):::planned
    P5((5. Quiz Processing)):::planned
    
    D1[(D1: User Data)]:::datastore
    D2[(D2: Document Metadata & Extracted Text)]:::datastore
    D3[(D3: Cloud Storage)]:::datastore
    D4[(D4: Questions Collection)]:::planned
    D5[(D5: Quiz Results)]:::planned
    
    User -- "Credentials" --> P1
    P1 -- "Auth Status" --> D1
    
    User -- "Document" --> P2
    P2 -- "File Validation" --> D2
    P2 -- "Raw File" --> D3
    
    P2 -- "File URL" --> P3
    P3 -- "Extracted Text" --> D2
    
    User -. "Preferences" .-> P4
    D2 -. "Extracted Text" .-> P4
    P4 -. "Prompts" .-> LLM
    LLM -. "Structured Questions" .-> P4
    P4 -. "Save Questions" .-> D4
    
    D4 -. "Question Data" .-> P5
    User -. "User Answers" .-> P5
    P5 -. "Score & Results" .-> D5
    P5 -. "Quiz Results View" .-> User
```

## 5. Use Case Diagram

```mermaid
flowchart LR
    classDef actor fill:#ddd,stroke:#333,stroke-width:2px;
    classDef usecase fill:#bbf,stroke:#333,stroke-width:1px,rx:20,ry:20;
    classDef planned fill:#f9f,stroke:#333,stroke-width:1px,rx:20,ry:20,stroke-dasharray: 5 5;
    
    Student([Student]):::actor
    Teacher([Teacher]):::actor
    Professional([Job Seeker / Professional]):::actor
    
    subgraph "StudySmart AI System"
        UC1(Register / Login):::usecase
        UC2(Upload Document):::usecase
        UC3(View Documents):::usecase
        UC4(Select Question Type):::planned
        UC5(Select Difficulty):::planned
        UC6(Generate Questions):::planned
        UC7(Attempt Quiz):::planned
        UC8(View Results):::planned
        UC9(Save / Download Material):::planned
    end
    
    Student --> UC1
    Teacher --> UC1
    Professional --> UC1
    
    Student --> UC2
    Student --> UC3
    Student -.-> UC4
    Student -.-> UC5
    Student -.-> UC6
    Student -.-> UC7
    Student -.-> UC8
    Student -.-> UC9
    
    Teacher --> UC2
    Teacher --> UC3
    Teacher -.-> UC6
    Teacher -.-> UC9
```

## 6. Logical Data Model / ER Diagram

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        string email
        string hashed_password
        string full_name
        datetime created_at
    }
    
    DOCUMENT {
        ObjectId _id PK
        ObjectId user_id FK
        string filename
        string file_type
        int file_size_bytes
        object storage "provider, public_id, secure_url"
        string status "Pending, Processing, Processed, Failed"
        string extracted_text
        object processing_metadata
        datetime created_at
    }
    
    QUESTION {
        ObjectId _id PK
        ObjectId document_id FK
        string type "MCQ, Short Answer, Descriptive"
        string difficulty "Easy, Medium, Hard"
        string question_text
        array options "For MCQs"
        string correct_answer
    }
    
    QUIZ_ATTEMPT {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId document_id FK
        int score
        int total_questions
        datetime attempted_at
    }
    
    USER ||--o{ DOCUMENT : "uploads"
    USER ||--o{ QUIZ_ATTEMPT : "attempts (planned)"
    DOCUMENT ||--o{ QUESTION : "generates (planned)"
    DOCUMENT ||--o{ QUIZ_ATTEMPT : "has (planned)"
```

## 7. Deployment Architecture

```mermaid
flowchart TD
    classDef planned fill:#f9f,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5;
    classDef external fill:#bfb,stroke:#333,stroke-width:2px;
    classDef component fill:#bbf,stroke:#333,stroke-width:2px;

    User[User Browser]:::external
    
    subgraph VercelDeployment [Frontend Hosting: Vercel]
        React[React / Vite Frontend]:::component
    end
    
    subgraph RenderDeployment [Backend Hosting: Render]
        FastAPI[FastAPI Backend]:::component
    end
    
    User <-->|HTTPS| React
    React <-->|REST APIs| FastAPI
    
    FastAPI <-->|MongoDB Protocol| Mongo[(MongoDB Atlas)]:::external
    FastAPI <-->|Cloud API| Cloudinary[(Cloudinary Storage)]:::external
    FastAPI <-.->|REST API| LLM[OpenAI / Gemini API]:::planned
```

# Diagram Verification Notes

*   **System Architecture / HLD:** Represents the high-level decoupled architecture. Validated against the current FastApi/React setup and `pypdf`/`python-docx` implementations. The AI generation router and Quiz UI are explicitly marked as planned.
*   **End-to-End System Workflow:** Maps the chronological execution flow. The upload, Cloudinary upload, MongoDB metadata creation, and background extraction tasks are implemented. AI analysis, question generation, and quiz features are marked as planned.
*   **DFD Level 0:** Represents the system boundary and external entities. The AI/LLM Provider is marked as a planned external dependency.
*   **DFD Level 1:** Details the specific data stores and major processing steps. The `Users` and `Documents` collections are verified from the current backend models. The `Questions` and `Quiz Results` collections are planned extensions.
*   **Use Case Diagram:** Defines actor interactions with the system. Uploading and viewing documents are implemented. All quiz and AI generation interactions are properly marked as planned.
*   **Logical Data Model / ER Diagram:** The `USER` and `DOCUMENT` entities accurately reflect the current `app.models` schema. The `QUESTION` and `QUIZ_ATTEMPT` entities are logical predictions based on the approved project scope and are marked as planned relationships.
*   **Deployment Architecture:** Represents the planned production deployment using Vercel (Frontend) and Render (Backend) as instructed in the project guidelines, interacting with MongoDB Atlas and Cloudinary APIs.
