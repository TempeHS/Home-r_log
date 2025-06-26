# Home(r)_log

## Application Overview
Home(r)_log is a collaborative development logging platform inspired by Homer Simpson, designed to help development teams track project progress, log work sessions, and foster community interaction through forums and social features.

This design was influenced through direct collaboration over specifications and requirements with colleagesand clients. This was decided trhough brainstorms, forms, and diagrams. as seen here;


## Core Architecture

### Backend Architecture
- **Framework:** Flask 3.0.0+ with Python 3.12+
- **Database:** SQLAlchemy ORM with SQLite
- **Authentication:** Flask-Login with session management
- **Security:** CSRF protection, bcrypt hashing, input sanitization
- **API Integration:** GitHub API through custom GoGitter service

### Frontend Architecture
- **UI Framework:** Bootstrap 5 with custom CSS
- **JavaScript:** Vanilla JS with modular class architecture
- **Loading System:** Custom animation system with Homer-themed elements
- **Responsive Design:** Mobile-first approach with progressive enhancement

## Key Application Features

### 1. User Management System
- **Registration/Login:** Secure authentication with email verification
- **Two-Factor Authentication:** Email-based 2FA for enhanced security
- **API Key Generation:** Programmatic access for developers
- **Profile Management:** Personal dashboard with activity tracking
- **Session Security:** 1-hour timeout with secure cookie handling

### 2. Project Management
- **Project Creation:** GitHub repository integration with team assignment
- **Team Collaboration:** Multi-user project access and permissions
- **Project Visualization:** Timeline view with commit history
- **Entry Tracking:** Work session logging with time tracking
- **Statistics Dashboard:** Project metrics and contributor analytics

### 3. Development Logging
- **Time Tracking:** Start/end time with automatic duration calculation
- **Commit Integration:** Link log entries to specific GitHub commits
- **Content Management:** Rich text entries with markdown support
- **Search & Filter:** Advanced search across projects, developers, and dates
- **Entry Validation:** Input sanitization and data integrity checks

### 4. Social Features
- **Reaction System:** Homer-themed like/dislike with donut/bagel icons
- **Comment System:** Nested comments with reply functionality
- **Forum System:** Language-specific and project-specific forums
- **Activity Feed:** Personalized dashboard with relevant project updates
- **User Profiles:** Portfolio-style profiles with contribution history

### 5. GitHub Integration (GoGitter Service)
- **Repository Connection:** Direct GitHub repo linking and validation
- **Commit Visualization:** Timeline view of project commits
- **Language Detection:** Automatic programming language identification
- **Commit-Entry Mapping:** Link work sessions to specific commits
- **Repository Metrics:** Stars, forks, and activity statistics

## Security Implementation

### Authentication & Authorization
- **Password Security:** Bcrypt hashing with salt
- **Session Management:** Secure session tokens with expiration
- **CSRF Protection:** Token-based protection on all forms
- **API Authentication:** API key system for programmatic access
- **Input Validation:** Comprehensive sanitization and validation

### Data Protection
- **XSS Prevention:** HTML sanitization and output encoding
- **SQL Injection Protection:** SQLAlchemy ORM with parameterized queries
- **File Upload Security:** Validation and sanitization of uploaded content
- **Rate Limiting:** Protection against brute force attacks
- **Secure Headers:** HTTPS enforcement and security headers

## Database Schema

### Core Models
- **User:** Authentication, profile, and settings
- **Project:** Repository information and team management
- **LogEntry:** Work session tracking with time and content
- **EntryReaction:** Social interaction system
- **Comment:** Nested commenting system
- **ForumCategory/Topic/Reply:** Community forum structure
- **LanguageTag:** Programming language categorization

### Relationships
- **Many-to-Many:** Users ↔ Projects (team membership)
- **One-to-Many:** Projects → LogEntries, Users → Comments
- **Self-Referencing:** Comments (nested replies)
- **Association Tables:** Project tags and team memberships

##  Development Sprint History & Agile Documentation

## Sprint Overview
The Home(r)_log project was developed using Agile methodology over 8 weeks, with iterative sprints focusing on core functionality, user experience, and security enhancements.

This design and 

## Sprint 1: Foundation & Architecture (Week 1)
**Commits:** `2678ecf`, `f998c2c`, `70b764b`, `744d154`
- **Goal:** Project initialization and architectural planning
- **Achievements:**
  - Initial repository setup
  - Project structure definition
  - Technology stack selection (Flask, SQLAlchemy, Bootstrap)
  - Database schema design
- **Key Features:** Basic Flask application structure

## Sprint 2: Core Project System (Week 2-3)
**Commits:** `70d0370`, `f64cf78`, `86bddf4`, `08809cc`, `cce3a04`, `ceba53c`
- **Goal:** Implement foundational project management system
- **Achievements:**
  - Project creation and management
  - Team member assignment system
  - Projects listing page
  - Dynamic project information display
  - Project titles and descriptions
- **Key Features:** 
  - `/projects` endpoint
  - Project creation form
  - Team collaboration support

## Sprint 3: GitHub Integration & Visualization (Week 4-5)
**Commits:** `52a6d5a`, `41dd850`, `1630f56`, `c4c00aa`
- **Goal:** Integrate GitHub API and commit visualization
- **Achievements:**
  - GoGitter service implementation
  - GitHub repository integration
  - Commit history visualization
  - Roadmap timeline feature
- **Key Features:**
  - GitHub API integration
  - Commit-entry relationship mapping
  - Visual project timeline

## Sprint 4: Security & Bug Fixes (Week 5-6)
**Commits:** `1f88bc2`, `d3582fe`, `e315ec7`, `18e893c`, `25bd9da`, `2d91353`, `4e16611`, `25f13d1`
- **Goal:** Enhance security and fix critical bugs
- **Achievements:**
  - CSRF protection implementation
  - Input sanitization
  - Session security improvements
  - HTML rendering fixes
  - Werkzeug security updates
- **Key Features:**
  - Secure authentication
  - XSS protection
  - Session management

## Sprint 5: User Interactions & Reactions (Week 6-7)
**Commits:** `a75c67c`, `4d3b78b`, `026324b`, `695efe2`, `67ca145`
- **Goal:** Add social features and user interactions
- **Achievements:**
  - Like/dislike reaction system
  - Comment and reply functionality
  - Entry-commit relationship refinement
  - Profile management improvements
  - Reaction UI with donut/bagel theme
- **Key Features:**
  - Social interaction system
  - User engagement metrics
  - Homer-themed UI elements

## Sprint 6: Visual Polish & UX (Week 7-8)
**Commits:** `74b8488`, `baa8ad3`, `37d0680`, `7515216`
- **Goal:** Improve user experience and visual appeal
- **Achievements:**
  - Reaction management system
  - Image integration for reactions
  - Frontend-backend connection fixes
  - GoGitter functionality restoration
  - Smooth server interaction handling
- **Key Features:**
  - Enhanced UI/UX
  - Visual feedback systems
  - Improved navigation flow

## Sprint 7: Advanced Features & Loading (Week 8-9)
**Commits:** `b199300`, `453da50`
- **Goal:** Add advanced features and loading animations
- **Achievements:**
  - Loading buffer animations
  - Page transition effects
  - Project/entry loading cards
  - Animation stylization
- **Key Features:**
  - Dynamic loading animations
  - Improved perceived performance
  - Visual loading feedback

## Sprint 8: Forums & Search Enhancement (Week 9-10)
**Commits:** `06d8f63`, `e7cdc93`, `922f348`, `3a4a5cc`
- **Goal:** Implement forum system and enhance search
- **Achievements:**
  - Forum system for coding languages
  - Advanced search functionality
  - Profile page integration
  - Language icon system
  - Security updates
  - Code cleanup and optimization
- **Key Features:**
  - Community forum system
  - Enhanced search capabilities
  - Language-specific forums
  - Improved profile management

## Sprint Metrics & Outcomes
- **Total Commits:** 29 commits over 8 weeks
- **Average Commits per Sprint:** 3-4 commits
- **Code Quality:** Continuous refactoring and security improvements
- **Feature Delivery:** 100% of core features delivered
- **Technical Debt:** Addressed through dedicated security and cleanup sprints


##  API endpoint usage

Each endpoint includes example usage and expected responses. Click to expand any section for details.

### Authentication Endpoints

<details>
<summary><strong>POST /api/auth/signup</strong> - Create new user account</summary>

**Purpose:** Register a new user with email, password, and developer tag
**Authentication:** CSRF token required
**Required Fields:** `email`, `password`, `developer_tag`

```bash
# Example
TOKEN=$(cat csrf_token.txt)
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: $TOKEN" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!",
    "developer_tag": "testdev"
  }'

# Success Response
{"message": "Registration successful", "redirect": "/"}

# Error Examples  
{"error": "Email already exists"} (400)
{"error": "Password must be at least 7 characters long"} (400)
```
</details>

<details>
<summary><strong>POST /api/auth/login</strong> - Login existing user</summary>

**Purpose:** Authenticate user and create session
**Authentication:** CSRF token required
**Required Fields:** `email`, `password`

```bash
# Example
TOKEN=$(cat csrf_token.txt)
curl -X POST http://localhost:5000/api/auth/login \
  -c cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: $TOKEN" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }'

# Success Response (No 2FA)
{"message": "Login successful", "redirect": "/"}

# Success Response (2FA Required)
{"message": "2FA code sent", "redirect": "/verify"}

# Error Response
{"error": "Invalid credentials"} (401)
```
</details>

<details>
<summary><strong>POST /api/auth/logout</strong> - Logout user</summary>

**Purpose:** Terminate user session
**Authentication:** CSRF token required

```bash
# Example
TOKEN=$(cat csrf_token.txt)
curl -X POST http://localhost:5000/api/auth/logout \
  -b cookies.txt \
  -H "X-CSRF-TOKEN: $TOKEN"

# Response
{"message": "Logged out successfully"}
```
</details>

<details>
<summary><strong>POST /api/auth/enable-2fa</strong> - Enable two-factor authentication</summary>

**Purpose:** Enable 2FA for user account (sends email verification)
**Authentication:** Login session + CSRF token required

```bash
# Example
TOKEN=$(cat csrf_token.txt)
curl -X POST http://localhost:5000/api/auth/enable-2fa \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: $TOKEN"

# Response
{"message": "Verification code sent"}
```
</details>

<details>
<summary><strong>POST /api/auth/verify-2fa</strong> - Verify 2FA code</summary>

**Purpose:** Verify 2FA setup with email code
**Authentication:** Login session + CSRF token required
**Required Fields:** `code` (6-digit verification code from email)

```bash
# Example (check your email for the code)
TOKEN=$(cat csrf_token.txt)
curl -X POST http://localhost:5000/api/auth/verify-2fa \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: $TOKEN" \
  -d '{
    "code": "123456"
  }'

# Success Response
{"message": "2FA enabled successfully"}

# Error Response
{"error": "Invalid verification code"} (400)
```
</details>

### User Management Endpoints

<details>
<summary><strong>POST /api/user/generate-key</strong> - Generate API key</summary>

**Purpose:** Generate API key for programmatic access
**Authentication:** Login session + CSRF token required

```bash
# Example
TOKEN=$(cat csrf_token.txt)
curl -X POST http://localhost:5000/api/user/generate-key \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: $TOKEN"

# Response
{"api_key": "dvlg_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6", "message": "API key generated"}

# Save for later use
echo "dvlg_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" > api_key.txt
```
</details>

<details>
<summary><strong>GET /api/entries/user-stats</strong> - Get user statistics</summary>

**Purpose:** Get user activity statistics and profile data
**Authentication:** Login session required

```bash
# Example
curl -b cookies.txt http://localhost:5000/api/entries/user-stats

# Response
{
  "developer_tag": "testdev",
  "email": "testuser@example.com",
  "project_count": 2,
  "entry_count": 5,
  "entries": [...],
  "two_fa_enabled": true
}
```
</details>

<details>
<summary><strong>GET /api/user/forum-posts</strong> - Get user's forum posts</summary>

**Purpose:** Get user's forum topics and posts
**Authentication:** Login session required

```bash
# Example
curl -b cookies.txt http://localhost:5000/api/user/forum-posts

# Response
[
  {
    "id": 1,
    "title": "Need help with Flask routing",
    "content": "Having trouble with...",
    "created_at": "2024-02-01T10:00:00",
    "replies_count": 3,
    "forum_name": "Python - Help",
    "language": "python",
    "category": "help"
  }
]
```
</details>

### Entry Management Endpoints

<details>
<summary><strong>POST /api/entries</strong> - Create new log entry</summary>

**Purpose:** Create a new development log entry
**Authentication:** Login session + CSRF token OR API key
**Required Fields:** `title`, `content`, `project_name`, `start_time`, `end_time`, `time_worked`

```bash
# Example with API key (recommended)
API_KEY=$(cat api_key.txt)
curl -X POST http://localhost:5000/api/entries \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "title": "Implemented user authentication",
    "content": "Added bcrypt password hashing and session management. Fixed several security vulnerabilities.",
    "project_name": "DevLog Platform",
    "start_time": "2024-02-01T09:00:00",
    "end_time": "2024-02-01T12:30:00",
    "time_worked": 210,
    "commit_sha": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
  }'

# Success Response
{
  "id": 1,
  "title": "Implemented user authentication",
  "content": "Added bcrypt password hashing...",
  "project_name": "DevLog Platform",
  "developer_tag": "testdev",
  "timestamp": "2024-02-01T12:35:00",
  "time_worked": 210,
  "likes_count": 0,
  "dislikes_count": 0
}

# Error Examples
{"error": "Missing required fields: title, content"} (400)
{"error": "Project name must be less than 100 characters"} (400)
```
</details>

<details>
<summary><strong>GET /api/entries</strong> - Get all entries</summary>

**Purpose:** Retrieve all log entries (ordered by timestamp)
**Authentication:** Login session required

```bash
# Example
curl -b cookies.txt http://localhost:5000/api/entries

# Response
[
  {
    "id": 2,
    "title": "Database optimization",
    "content": "Optimized query performance...",
    "project_name": "DevLog Platform", 
    "developer_tag": "testdev",
    "timestamp": "2024-02-01T16:05:00",
    "time_worked": 120
  },
  {
    "id": 1,
    "title": "Implemented user authentication",
    "content": "Added bcrypt password hashing...",
    "project_name": "DevLog Platform",
    "developer_tag": "testdev", 
    "timestamp": "2024-02-01T12:35:00",
    "time_worked": 210
  }
]
```
</details>

<details>
<summary><strong>GET /api/entries/&lt;id&gt;</strong> - Get specific entry</summary>

**Purpose:** Get detailed information about a specific entry
**Authentication:** Login session required
**URL Parameter:** Entry ID

```bash
# Example
curl -b cookies.txt http://localhost:5000/api/entries/1

# Response
{
  "id": 1,
  "title": "Implemented user authentication",
  "content": "Added bcrypt password hashing and session management...",
  "project_name": "DevLog Platform",
  "developer_tag": "testdev",
  "timestamp": "2024-02-01T12:35:00",
  "start_time": "2024-02-01T09:00:00",
  "end_time": "2024-02-01T12:30:00",
  "time_worked": 210,
  "commit_sha": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  "likes_count": 0,
  "dislikes_count": 0,
  "comments_count": 0,
  "user_reaction": null
}

# Error Response
{"error": "Entry not found"} (404)
```
</details>

<details>
<summary><strong>GET /api/entries/search</strong> - Search entries with filters</summary>

**Purpose:** Search entries with various filters
**Authentication:** Login session required
**Query Parameters:** `project`, `developer_tag`, `date`, `sort_field`, `sort_order`

```bash
# Example: Search by project
curl -b cookies.txt "http://localhost:5000/api/entries/search?project=DevLog%20Platform"

# Example: Search by developer and date
curl -b cookies.txt "http://localhost:5000/api/entries/search?developer_tag=testdev&date=2024-02-01"

# Example: Search with sorting
curl -b cookies.txt "http://localhost:5000/api/entries/search?project=DevLog%20Platform&sort_field=time_worked&sort_order=desc"

# Response
[
  {
    "id": 1,
    "title": "Implemented user authentication",
    "project_name": "DevLog Platform",
    "developer_tag": "testdev",
    "time_worked": 210
  }
]

# Error Response
{"error": "At least one search parameter is required"} (400)
```
</details>

<details>
<summary><strong>GET /api/entries/metadata</strong> - Get metadata</summary>

**Purpose:** Get list of available projects and developers for filters
**Authentication:** None required

```bash
# Example
curl http://localhost:5000/api/entries/metadata

# Response
{
  "projects": ["DevLog Platform", "My Blog", "API Server"],
  "developers": ["testdev", "alice", "bob"]
}
```
</details>

### Social Interaction Endpoints

<details>
<summary><strong>POST /api/entries/&lt;id&gt;/react</strong> - React to entry</summary>

**Purpose:** Add or toggle like/dislike reaction
**Authentication:** Login session required
**Required Fields:** `reaction_type` ("like" or "dislike")
**URL Parameter:** Entry ID

```bash
# Example: Like an entry
curl -X POST http://localhost:5000/api/entries/1/react \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "reaction_type": "like"
  }'

# Example: Dislike an entry  
curl -X POST http://localhost:5000/api/entries/1/react \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "reaction_type": "dislike"
  }'

# Success Response
{
  "likes_count": 1,
  "dislikes_count": 0,
  "user_reaction": "like"
}

# Error Response
{"error": "Invalid reaction type"} (400)
```
</details>

<details>
<summary><strong>GET /api/entries/&lt;id&gt;/comments</strong> - Get entry comments</summary>

**Purpose:** Get all comments for a specific entry
**Authentication:** Login session required
**URL Parameter:** Entry ID

```bash
# Example
curl -b cookies.txt http://localhost:5000/api/entries/1/comments

# Response
[
  {
    "id": 1,
    "entry_id": 1,
    "user_id": "testdev",
    "content": "Great work on the authentication system!",
    "timestamp": "2024-02-01T13:00:00",
    "parent_id": null,
    "replies": [
      {
        "id": 2,
        "entry_id": 1,
        "user_id": "alice",
        "content": "I agree, very secure implementation.",
        "timestamp": "2024-02-01T13:30:00",
        "parent_id": 1,
        "replies": []
      }
    ]
  }
]
```
</details>

<details>
<summary><strong>POST /api/entries/&lt;id&gt;/comments</strong> - Add comment to entry</summary>

**Purpose:** Add a comment or reply to an entry
**Authentication:** Login session required
**Required Fields:** `content`
**Optional Fields:** `parent_id` (for replies)
**URL Parameter:** Entry ID

```bash
# Example: Add top-level comment
curl -X POST http://localhost:5000/api/entries/1/comments \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a great implementation! The security measures look solid."
  }'

# Example: Add reply to comment
curl -X POST http://localhost:5000/api/entries/1/comments \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Thanks! I spent extra time on the bcrypt configuration.",
    "parent_id": 1
  }'

# Success Response
{
  "id": 3,
  "entry_id": 1,
  "user_id": "testdev",
  "content": "This is a great implementation!...",
  "timestamp": "2024-02-01T14:00:00",
  "parent_id": null,
  "replies": []
}

# Error Examples
{"error": "Comment content cannot be empty"} (400)
{"error": "Invalid parent comment"} (400)
```
</details>

## Testing & Automation Scripts

<details>
<summary><strong>Complete API Test Suite</strong> - Automated testing for all endpoints</summary>

Create `api_test_suite.sh` for comprehensive testing:

```bash
#!/bin/bash
# Comprehensive API Test Suite for DevLog

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 DevLog API Test Suite${NC}"
echo "=========================="

# Setup test environment
echo -e "${YELLOW}Setting up test environment...${NC}"
curl -s http://localhost:5000/login | grep "csrf-token" | sed 's/.*content="\([^"]*\)".*/\1/' > csrf_token.txt
TOKEN=$(cat csrf_token.txt)

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"
    
    echo -e "${YELLOW}Testing: $test_name${NC}"
    result=$(eval "$command" 2>&1)
    
    if echo "$result" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "Expected: $expected_pattern"
        echo "Got: $result"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Authentication Tests
echo -e "${BLUE}🔐 Authentication Tests${NC}"
run_test "User Registration" \
    "curl -s -X POST http://localhost:5000/api/auth/signup -H 'Content-Type: application/json' -H 'X-CSRF-TOKEN: $TOKEN' -d '{\"email\": \"test@example.com\", \"password\": \"TestPass123!\", \"developer_tag\": \"testdev\"}'" \
    "Registration successful"

run_test "User Login" \
    "curl -s -X POST http://localhost:5000/api/auth/login -c cookies.txt -H 'Content-Type: application/json' -H 'X-CSRF-TOKEN: $TOKEN' -d '{\"email\": \"test@example.com\", \"password\": \"TestPass123!\"}'" \
    "Login successful"

# Generate API key for further tests
curl -s -X POST http://localhost:5000/api/user/generate-key -b cookies.txt -H 'Content-Type: application/json' -H "X-CSRF-TOKEN: $TOKEN" | grep -o '"api_key":"[^"]*"' | cut -d'"' -f4 > api_key.txt
API_KEY=$(cat api_key.txt)

# Entry Management Tests
echo -e "${BLUE}� Entry Management Tests${NC}"
run_test "Create Entry with API Key" \
    "curl -s -X POST http://localhost:5000/api/entries -H 'Content-Type: application/json' -H 'X-API-Key: $API_KEY' -d '{\"title\": \"Test Entry\", \"content\": \"Test content\", \"project_name\": \"Test Project\", \"start_time\": \"2024-02-01T10:00:00\", \"end_time\": \"2024-02-01T11:00:00\", \"time_worked\": 60}'" \
    "Test Entry"

run_test "Get All Entries" \
    "curl -s -b cookies.txt http://localhost:5000/api/entries" \
    "Test Entry"

run_test "Get Metadata" \
    "curl -s http://localhost:5000/api/entries/metadata" \
    "projects"

# Error Handling Tests
echo -e "${BLUE}⚠️ Error Handling Tests${NC}"
run_test "Invalid Entry ID" \
    "curl -s -b cookies.txt http://localhost:5000/api/entries/99999" \
    "Entry not found"

run_test "Missing Required Fields" \
    "curl -s -X POST http://localhost:5000/api/entries -H 'Content-Type: application/json' -H 'X-API-Key: $API_KEY' -d '{\"title\": \"Incomplete\"}'" \
    "Missing required fields"

# Cleanup
rm -f csrf_token.txt cookies.txt api_key.txt

# Results
echo -e "${BLUE}📊 Test Results${NC}"
echo "==============="
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
else
    echo -e "${RED}💥 Some tests failed!${NC}"
fi
```

**Usage:**
```bash
chmod +x api_test_suite.sh
./api_test_suite.sh
```
</details>

<details>
<summary><strong>Performance Benchmark Script</strong> - Measure API response times</summary>

Create `api_benchmark.sh` for performance testing:

```bash
#!/bin/bash
# API Performance Benchmark Script

echo "DevLog API Performance Benchmark"
echo "===================================="

# Setup
curl -s http://localhost:5000/login | grep "csrf-token" | sed 's/.*content="\([^"]*\)".*/\1/' > csrf_token.txt
TOKEN=$(cat csrf_token.txt)

# Function to benchmark endpoint
benchmark_endpoint() {
    local name="$1"
    local command="$2"
    local iterations=10
    
    echo "Benchmarking: $name ($iterations iterations)"
    
    total_time=0
    for i in $(seq 1 $iterations); do
        start=$(date +%s%N)
        eval "$command" > /dev/null 2>&1
        end=$(date +%s%N)
        duration=$(((end - start) / 1000000))
        total_time=$((total_time + duration))
    done
    
    avg_time=$((total_time / iterations))
    echo "  Average response time: ${avg_time}ms"
    echo ""
}

# Benchmark different endpoints
benchmark_endpoint "Get Metadata" \
    "curl -s http://localhost:5000/api/entries/metadata"

benchmark_endpoint "User Login" \
    "curl -s -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -H 'X-CSRF-TOKEN: $TOKEN' -d '{\"email\": \"test@example.com\", \"password\": \"TestPass123!\"}'"

benchmark_endpoint "Get All Entries" \
    "curl -s -b cookies.txt http://localhost:5000/api/entries"

echo "✅ Benchmark complete!"
rm -f csrf_token.txt cookies.txt
```

**Usage:**
```bash
chmod +x api_benchmark.sh
./api_benchmark.sh
```
</details>

