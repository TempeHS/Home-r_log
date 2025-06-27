TEST DATA TABLES FOR DEVLOG SYSTEM
═══════════════════════════════════════════

TABLE 1: PASSWORD VALIDATION (DataManager.validate_password)
Variable: password (String)
Endpoint: /api/auth/signup, /api/auth/login

Variable          | Maximum    | Minimum | Default Value | Expected Output                           | Actual Output | Reason for Inclusion
password          | 1000 chars | 7 chars | None         | Valid password accepted                   | TBD          | Boundary testing for minimum length requirement
password_empty    | N/A        | 0 chars | ""           | ValueError: "Password must be at least 7 characters long" | TBD | Path testing for empty input validation
password_no_upper | N/A        | 7 chars | "lowercase1" | ValueError: "Password must contain at least one uppercase letter" | TBD | Path testing for uppercase requirement
password_no_special| N/A       | 7 chars | "Password"   | ValueError: "Password must contain at least one number or special character" | TBD | Path testing for special char requirement
password_valid    | N/A        | 7 chars | "Password1"  | Encoded password bytes                    | TBD          | Path testing for valid password acceptance

TABLE 2: PROJECT NAME VALIDATION (DataManager.sanitize_project)
Variable: project_name (String)
Endpoint: /api/entries (POST), /projects/new

Variable               | Maximum    | Minimum | Default Value | Expected Output                              | Actual Output | Reason for Inclusion
project_name          | 100 chars | 1 char  | None         | Sanitized project name                       | TBD          | Boundary testing for length limits
project_name_empty    | N/A        | 0 chars | ""           | ValueError: "Invalid project name"          | TBD          | Path testing for empty validation
project_name_too_long | 101 chars  | N/A     | "A"*101      | ValueError: "Project name must be less than 100 characters" | TBD | Boundary testing for maximum length
project_name_invalid  | N/A        | 1 char  | "!invalid"   | ValueError: "Project name must start with alphanumeric" | TBD | Path testing for character validation
project_name_valid    | 100 chars  | 1 char  | "MyProject"  | "myproject"                                 | TBD          | Path testing for valid input sanitization

TABLE 3: EMAIL VALIDATION (DataManager.sanitize_email)
Variable: email (String)
Endpoint: /api/auth/signup, /api/auth/login

Variable          | Maximum     | Minimum | Default Value      | Expected Output                        | Actual Output | Reason for Inclusion
email            | 254 chars   | 5 chars | None              | Sanitized lowercase email              | TBD          | Boundary testing for RFC email limits
email_empty      | N/A         | 0 chars | ""                | ValueError: "Invalid email format"    | TBD          | Path testing for empty validation
email_no_at      | N/A         | 5 chars | "invalid.com"     | ValueError: "Invalid email format"    | TBD          | Path testing for @ symbol requirement
email_no_domain  | N/A         | 5 chars | "user@"           | ValueError: "Invalid email format"    | TBD          | Path testing for domain requirement
email_valid      | 254 chars   | 5 chars | "user@domain.com" | "user@domain.com"                     | TBD          | Path testing for valid email acceptance

TABLE 4: CONTENT LENGTH VALIDATION (DataManager.sanitize_content)
Variable: content (String)
Endpoint: /api/entries (POST), forum topics/replies

Variable              | Maximum      | Minimum | Default Value | Expected Output                                  | Actual Output | Reason for Inclusion
content              | 10000 chars  | 1 char  | None         | Sanitized content                                | TBD          | Boundary testing for length limits
content_empty        | N/A          | 0 chars | ""           | ValueError: "Content cannot be empty"           | TBD          | Path testing for empty validation
content_max_length   | 10000 chars  | N/A     | "A"*10000    | Sanitized content (10000 chars)                | TBD          | Boundary testing for maximum allowed
content_over_limit   | 10001 chars  | N/A     | "A"*10001    | ValueError: "Content exceeds maximum length"    | TBD          | Boundary testing for length exceeded
content_valid        | 10000 chars  | 1 char  | "Valid text" | "Valid text"                                    | TBD          | Path testing for normal content

TABLE 5: TIME CALCULATION (DataManager.calculate_time_worked)
Variable: start_time, end_time (DateTime)
Endpoint: /api/entries (POST)

Variable                | Maximum           | Minimum          | Default Value            | Expected Output                           | Actual Output | Reason for Inclusion
time_worked            | 1440 minutes      | 1 minute         | None                    | Calculated minutes (integer)             | TBD          | Boundary testing for work session limits
time_negative          | N/A               | N/A              | end < start             | ValueError: "End time cannot be before start time" | TBD | Path testing for logical time validation
time_same              | N/A               | 0 minutes        | start = end             | 0 minutes                                | TBD          | Boundary testing for zero duration
time_one_minute        | N/A               | 1 minute         | 1 min difference        | 1 minute                                 | TBD          | Boundary testing for minimum work time
time_24_hours          | 1440 minutes      | N/A              | 24 hour difference      | 1440 minutes                             | TBD          | Boundary testing for maximum daily work

TABLE 6: DEVELOPER TAG VALIDATION (DataManager.sanitize_developer_tag)
Variable: developer_tag (String)
Endpoint: /api/auth/signup, user identification

Variable                | Maximum    | Minimum | Default Value | Expected Output              | Actual Output | Reason for Inclusion
developer_tag          | 50 chars  | 1 char  | None         | Lowercase sanitized tag      | TBD          | Boundary testing for tag length
developer_tag_empty    | N/A       | 0 chars | ""           | ""                          | TBD          | Path testing for empty handling
developer_tag_spaces   | 50 chars  | 1 char  | " DevTag "   | "devtag"                    | TBD          | Path testing for whitespace handling
developer_tag_case     | 50 chars  | 1 char  | "DevTag"     | "devtag"                    | TBD          | Path testing for case normalization
developer_tag_max      | 50 chars  | N/A     | "A"*50       | "a"*50                      | TBD          | Boundary testing for maximum length

TABLE 7: ENTRY ID VALIDATION (API Route Parameters)
Variable: entry_id (Integer)
Endpoint: /api/entries/<int:entry_id>, /entry/<int:entry_id>

Variable           | Maximum        | Minimum | Default Value | Expected Output                    | Actual Output | Reason for Inclusion
entry_id          | 2147483647     | 1       | None         | Entry object or 404                | TBD          | Boundary testing for integer limits
entry_id_zero     | N/A            | 0       | 0            | 404 Not Found                      | TBD          | Boundary testing for invalid ID
entry_id_negative | N/A            | -1      | -1           | 404 Not Found                      | TBD          | Boundary testing for negative values
entry_id_valid    | 2147483647     | 1       | 1            | Entry object (if exists)           | TBD          | Path testing for valid ID lookup
entry_id_nonexist | 2147483647     | 1       | 999999       | 404 Not Found                      | TBD          | Path testing for non-existent ID

TABLE 8: REACTION TYPE VALIDATION (ReactionType enum)
Variable: reaction_type (String/Integer)
Endpoint: /api/interactions/entries/<id>/react

Variable               | Maximum | Minimum | Default Value | Expected Output           | Actual Output | Reason for Inclusion
reaction_type_like     | N/A     | N/A     | "like"       | ReactionType.LIKE (1)     | TBD          | Path testing for valid like reaction
reaction_type_dislike  | N/A     | N/A     | "dislike"    | ReactionType.DISLIKE (2)  | TBD          | Path testing for valid dislike reaction
reaction_type_invalid  | N/A     | N/A     | "invalid"    | 400 Bad Request           | TBD          | Path testing for invalid reaction type
reaction_type_empty    | N/A     | N/A     | ""           | 400 Bad Request           | TBD          | Path testing for empty reaction type
reaction_type_none     | N/A     | N/A     | null         | 400 Bad Request           | TBD          | Path testing for null reaction type

TABLE 9: REPOSITORY URL VALIDATION (DataManager.sanitize_repository_url)
Variable: repository_url (String)
Endpoint: /projects/new

Variable                  | Maximum     | Minimum | Default Value                           | Expected Output                              | Actual Output | Reason for Inclusion
repository_url           | 500 chars  | 19 chars| None                                   | Valid GitHub URL                             | TBD          | Boundary testing for URL length
repository_url_empty     | N/A         | 0 chars | ""                                     | None                                         | TBD          | Path testing for empty URL
repository_url_invalid   | N/A         | 19 chars| "https://gitlab.com/user/repo"         | ValueError: "URL must be a valid GitHub repository URL" | TBD | Path testing for non-GitHub URLs
repository_url_valid     | 500 chars  | 19 chars| "https://github.com/user/repo"         | "https://github.com/user/repo"              | TBD          | Path testing for valid GitHub URLs
repository_url_malformed | N/A         | 5 chars | "not-a-url"                            | ValueError: "URL must be a valid GitHub repository URL" | TBD | Path testing for malformed URLs

TABLE 10: PAGINATION PARAMETERS (Search/List endpoints)
Variable: page, per_page (Integer)
Endpoint: Various list endpoints with pagination

Variable        | Maximum | Minimum | Default Value | Expected Output              | Actual Output | Reason for Inclusion
page           | 1000    | 1       | 1            | Paginated results            | TBD          | Boundary testing for page numbers
page_zero      | N/A     | 0       | 0            | Default to page 1            | TBD          | Boundary testing for invalid page
page_negative  | N/A     | -1      | -1           | Default to page 1            | TBD          | Boundary testing for negative page
per_page       | 100     | 1       | 20           | Limited results per page     | TBD          | Boundary testing for results limit
per_page_zero  | N/A     | 0       | 0            | Default to 20                | TBD          | Boundary testing for invalid limit
per_page_max   | 100     | N/A     | 100          | Maximum 100 results          | TBD          | Boundary testing for maximum limit

TESTING METHODOLOGY NOTES:
═══════════════════════════

1. BOUNDARY VALUE TESTING:
   - Test at minimum, maximum, and just beyond boundaries
   - Focus on edge cases where validation logic changes behavior
   - Test off-by-one errors in length validations

2. PATH TESTING:
   - Test all conditional branches in validation methods
   - Ensure error handling paths are exercised
   - Test both success and failure scenarios

3. EQUIVALENCE PARTITIONING:
   - Group similar input types (valid emails, invalid emails, etc.)
   - Test representative values from each partition
   - Ensure consistent behavior within partitions

4. ERROR HANDLING:
   - Verify appropriate error messages are returned
   - Test that database rollbacks occur on failures
   - Ensure no sensitive data is leaked in error responses

5. INTEGRATION TESTING:
   - Test complete API workflows end-to-end
   - Verify data persistence across requests
   - Test authentication and authorization boundaries
