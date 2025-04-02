



## Flow

```mermaid
flowchart TD
    subgraph "Admin UI"
        AdminApp[React Admin App]
        TeacherPersonaManager[Teacher Persona Manager]
        BookFeatureManager[Book Feature Manager]
        BookManager[Book Manager]
    end
    
    subgraph "Backend API"
        APIRouter[Express Router]
        PersonaController[Teacher Persona Controller]
        BookController[Book Controller]
        FeatureController[Feature Controller]
        FileService[File Service]
        DBService[SQLite Service]
    end
    
    subgraph "Storage"
        Files[File System]
        SQLite[SQLite Database]
    end
    
    AdminApp --> TeacherPersonaManager
    AdminApp --> BookFeatureManager
    AdminApp --> BookManager
    
    TeacherPersonaManager --> APIRouter
    BookFeatureManager --> APIRouter
    BookManager --> APIRouter
    
    APIRouter --> PersonaController
    APIRouter --> BookController
    APIRouter --> FeatureController
    
    PersonaController --> FileService
    BookController --> FileService
    FeatureController --> FileService
    
    PersonaController --> DBService
    BookController --> DBService
    FeatureController --> DBService
    
    FileService --> Files
    DBService --> SQLite
```