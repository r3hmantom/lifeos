# LifeOS Backend
API documentation for the LifeOS

## Version: 1.0.0

### Available authorizations
#### bearerAuth (HTTP, bearer)
Bearer format: JWT

---
## Assistant
AI Assistant endpoints

### [POST] /assistant/chat
**Chat with the AI assistant for schedule planning**

#### Request Body

| Required | Schema |
| -------- | ------ |
|  Yes | **application/json**: [ChatRequest](#chatrequest)<br> |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | Assistant response | **application/json**: [ChatResponse](#chatresponse)<br> |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

---
## Auth
Authentication endpoints

### [POST] /auth/register
**Register new user**

#### Request Body

| Required | Schema |
| -------- | ------ |
|  Yes | **application/json**: { **"name"**: string, **"email"**: string, **"password"**: string }<br> |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | User registered successfully | **application/json**: [AuthResponse](#authresponse)<br> |
| 400 | User already exists |  |

### [POST] /auth/login
**Authenticate existing user**

#### Request Body

| Required | Schema |
| -------- | ------ |
|  Yes | **application/json**: { **"email"**: string, **"password"**: string }<br> |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | Login successful | **application/json**: [AuthResponse](#authresponse)<br> |
| 400 | Invalid credentials |  |

---
## Goals
Goal management endpoints

### [GET] /goals
**Get all user goals**

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | List of goals | **application/json**: { **"data"**: [ [Goal](#goal) ] }<br> |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

### [POST] /goals
**Create a new goal**

#### Request Body

| Required | Schema |
| -------- | ------ |
|  Yes | **application/json**: { **"title"**: string, **"focus"**: string, **"deadline"**: dateTime, **"priority"**: string, <br>**Available values:** "High", "Medium", "Low" }<br> |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | Goal created successfully | **application/json**: [Goal](#goal)<br> |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

### [PATCH] /goals/{id}
**Update a goal**

#### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id | path |  | Yes | string |

#### Request Body

| Required | Schema |
| -------- | ------ |
|  Yes | **application/json**: { **"title"**: string, **"focus"**: string, **"deadline"**: dateTime, **"priority"**: string, <br>**Available values:** "High", "Medium", "Low", **"isActive"**: boolean }<br> |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | Goal updated successfully | **application/json**: [Goal](#goal)<br> |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

### [DELETE] /goals/{id}
**Delete a goal**

#### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id | path |  | Yes | string |

#### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Goal deleted successfully |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

---
## Insights
Productivity insights endpoints

### [GET] /insights
**Get productivity insights and metrics**

#### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| startDate | query |  | No | date |
| endDate | query |  | No | date |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | Insights data | **application/json**: [InsightMetrics](#insightmetrics)<br> |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

---
## Memories
Memory management endpoints

### [GET] /memories
**Get all user memories**

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | List of memories | **application/json**: { **"data"**: [ [Memory](#memory) ] }<br> |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

### [POST] /memories
**Create a new memory/commitment**

#### Request Body

| Required | Schema |
| -------- | ------ |
|  Yes | **application/json**: { **"title"**: string, **"description"**: string, **"tags"**: [ string ], **"date"**: dateTime }<br> |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | Memory created successfully | **application/json**: [Memory](#memory)<br> |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

### [PATCH] /memories/{id}
**Update a memory**

#### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id | path |  | Yes | string |

#### Request Body

| Required | Schema |
| -------- | ------ |
|  Yes | **application/json**: { **"title"**: string, **"description"**: string, **"tags"**: [ string ], **"date"**: dateTime, **"isActive"**: boolean }<br> |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | Memory updated successfully | **application/json**: [Memory](#memory)<br> |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

### [DELETE] /memories/{id}
**Delete a memory**

#### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id | path |  | Yes | string |

#### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Memory deleted successfully |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

---
## Schedule
Schedule management endpoints

### [GET] /schedule
**Get the generated schedule for a specific date**

#### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| date | query | Date in YYYY-MM-DD format | No | date |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | Daily schedule | **application/json**: { **"date"**: string, **"items"**: [ [ScheduleItem](#scheduleitem) ] }<br> |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

### [POST] /schedule
**Create a new schedule item manually**

#### Request Body

| Required | Schema |
| -------- | ------ |
|  Yes | **application/json**: [ScheduleItem](#scheduleitem)<br> |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | Created schedule item | **application/json**: [ScheduleItem](#scheduleitem)<br> |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

### [PATCH] /schedule/{id}
**Update a schedule item**

#### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id | path |  | Yes | string |

#### Request Body

| Required | Schema |
| -------- | ------ |
|  Yes | **application/json**: [ScheduleItem](#scheduleitem)<br> |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | Updated schedule item | **application/json**: [ScheduleItem](#scheduleitem)<br> |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

### [DELETE] /schedule/{id}
**Delete a schedule item**

#### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id | path |  | Yes | string |

#### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Item deleted successfully |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

### [POST] /schedule/generate
**Trigger AI to generate a schedule**

#### Request Body

| Required | Schema |
| -------- | ------ |
|  Yes | **application/json**: [ScheduleGenerationRequest](#schedulegenerationrequest)<br> |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | Schedule generated successfully | **application/json**: { **"message"**: string, **"schedule"**: { **"date"**: string, **"items"**: [ [ScheduleItem](#scheduleitem) ] } }<br> |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

### [POST] /schedule/batch
**Save multiple schedule items at once**

#### Request Body

| Required | Schema |
| -------- | ------ |
|  Yes | **application/json**: [BatchScheduleRequest](#batchschedulerequest)<br> |

#### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Schedule items saved successfully |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

---
## Settings
User settings management

### [GET] /settings
**Get user settings**

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | User settings | **application/json**: [UserSettings](#usersettings)<br> |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

### [PATCH] /settings
**Update user settings**

#### Request Body

| Required | Schema |
| -------- | ------ |
|  Yes | **application/json**: { **"theme"**: string, <br>**Available values:** "light", "dark", "system", **"notificationsEnabled"**: boolean, **"timezone"**: string }<br> |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | Updated user settings | **application/json**: [UserSettings](#usersettings)<br> |

##### Security

| Security Schema | Scopes |
| --------------- | ------ |
| bearerAuth |  |

---
### Schemas

#### User

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string (uuid) |  | No |
| email | string |  | No |
| name | string |  | No |
| avatarUrl | string |  | No |

#### AuthResponse

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| user | [User](#user) |  | No |
| token | string |  | No |

#### Memory

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string (uuid) |  | No |
| title | string |  | No |
| description | string |  | No |
| tags | [ string ] |  | No |
| date | dateTime |  | No |
| isActive | boolean |  | No |

#### Goal

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string (uuid) |  | No |
| title | string |  | No |
| focus | string |  | No |
| deadline | dateTime |  | No |
| priority | string, <br>**Available values:** "High", "Medium", "Low" | *Enum:* `"High"`, `"Medium"`, `"Low"` | No |
| isActive | boolean |  | No |

#### ScheduleItem

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string (uuid) |  | No |
| title | string |  | No |
| description | string |  | No |
| startTime | dateTime |  | No |
| endTime | dateTime |  | No |
| type | string |  | No |
| relatedId | string |  | No |
| isCompleted | boolean |  | No |

#### ScheduleGenerationRequest

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| timezone | string |  | No |
| date | date |  | No |
| preferences | { **"startOfDay"**: string, **"endOfDay"**: string } |  | No |
| goalIds | [ string (uuid) ] |  | No |
| memoryIds | [ string (uuid) ] |  | No |
| customPrompt | string |  | No |

#### ChatMessage

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| role | string, <br>**Available values:** "user", "assistant", "system" | *Enum:* `"user"`, `"assistant"`, `"system"` | Yes |
| content | string |  | Yes |

#### ChatRequest

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| messages | [ [ChatMessage](#chatmessage) ] |  | Yes |
| context | { **"date"**: date, **"timezone"**: string, **"selectedGoalIds"**: [ string (uuid) ], **"selectedMemoryIds"**: [ string (uuid) ] } |  | No |

#### ChatResponse

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| message | string |  | No |
| intent | string, <br>**Available values:** "chat", "schedule_generated", "schedule_modified", "clarification_needed" | *Enum:* `"chat"`, `"schedule_generated"`, `"schedule_modified"`, `"clarification_needed"` | No |
| data | object |  | No |

#### BatchScheduleRequest

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| date | date |  | Yes |
| items | [ [ScheduleItem](#scheduleitem) ] |  | Yes |
| metadata | object | Audit trail data like prompt used, goals selected | No |

#### InsightMetrics

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| productivityScore | number |  | No |
| categoryDistribution | object |  | No |
| completedTasks | number |  | No |
| totalTasks | number |  | No |

#### UserSettings

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string (uuid) |  | No |
| userId | string (uuid) |  | No |
| theme | string, <br>**Available values:** "light", "dark", "system" | *Enum:* `"light"`, `"dark"`, `"system"` | No |
| notificationsEnabled | boolean |  | No |
| timezone | string |  | No |
| updatedAt | dateTime |  | No |
