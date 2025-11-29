# LifeOS Backend
API documentation for the LifeOS

## Version: 1.0.0

### Available authorizations
#### bearerAuth (HTTP, bearer)
Bearer format: JWT

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

#### UserSettings

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | string (uuid) |  | No |
| userId | string (uuid) |  | No |
| theme | string, <br>**Available values:** "light", "dark", "system" | *Enum:* `"light"`, `"dark"`, `"system"` | No |
| notificationsEnabled | boolean |  | No |
| timezone | string |  | No |
| updatedAt | dateTime |  | No |
