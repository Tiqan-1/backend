# Mubadarat Backend — CLAUDE.md

## Project Overview

**Mubadarat** is an Islamic educational platform backend. It manages training programs, levels, tasks (lessons, assignments, meetings, wird, oral tests), student subscriptions, and real-time chat.

- **Framework:** NestJS v11 + TypeScript v5.7
- **Database:** MongoDB via Mongoose v8 (ODM)
- **Auth:** Passport.js (JWT + local strategies), bcryptjs
- **Real-time:** Pusher
- **Email:** Nodemailer + Handlebars templates
- **i18n:** nestjs-i18n (Arabic fallback)
- **Tests:** Vitest (unit) + Supertest + mongodb-memory-server (E2E)
- **API Docs:** Swagger / OpenAPI at **`/swagger-ui`** (the `/api` prefix is for the REST routes, not the docs)

---

## Architecture

### Layered Modular Monolith

```
src/
├── features/           # 13 feature modules (self-contained)
│   ├── authentication/
│   ├── users/
│   ├── students/
│   ├── managers/
│   ├── programs/
│   ├── levels/
│   ├── tasks/          # Polymorphic: lesson | assignment | meeting | wird | oralTest
│   ├── lessons/
│   ├── subjects/
│   ├── assignments/
│   ├── assignment-responses/
│   ├── subscriptions/
│   ├── chat/
│   └── tokens/
├── shared/
│   ├── database-services/   # Migration system, SharedDocumentsService
│   ├── email/               # Nodemailer + Handlebars
│   ├── errors/              # SecurityErrorFilter
│   ├── helper/              # PaginationHelper, SearchFilterBuilder
│   ├── pipes/               # ParseMongoIdPipe
│   ├── decorators/          # @GetUser(), @Roles()
│   ├── repository/          # RepositoryMongoBase<T>, RepositoryBase<T>
│   └── test/                # MongoTestHelper, JwtMockModule, factories
├── i18n/ar/            # Arabic translations
├── app.module.ts
└── main.ts
```

### Layer Responsibilities
- **Controller** — HTTP endpoints, guards, pipes, Swagger decorators. No business logic.
- **Service** — All business logic, error throwing, logging.
- **Repository** — Data access only. Extends `RepositoryMongoBase<T>`.
- **Schema** — Mongoose document definitions with `@Prop()` decorators.
- **DTO** — Validation (`class-validator`), transformation, static `toDocument()`/`fromDocument()` factory methods.

---

## Key Patterns

### Module Structure (every feature follows this)
```
feature/
├── schemas/feature.schema.ts       # Mongoose schema + HydratedDocument type
├── dto/feature.dto.ts              # CreateDto, UpdateDto, SearchQueryDto, ResponseDto
├── feature.repository.ts           # extends RepositoryMongoBase<FeatureDocument>
├── feature.service.ts              # @Injectable(), business logic
├── feature.controller.ts           # @Controller('api/feature'), guards, Swagger
└── feature.module.ts               # NestJS module wiring
```

### Repository Pattern
All repositories extend `RepositoryMongoBase<T>` (`src/shared/repository/repository-mongo-base.ts`) which provides:
`create`, `findAll`, `findOne`, `findById`, `update` (via `$set`), `remove`, `countDocuments`.

Custom finders are added per-repository as needed.

### DTO Conventions
- DTOs use `class-validator` + `@ApiProperty()` for Swagger
- Static factory methods: `CreateDto.toDocument(dto, createdBy)`, `ResponseDto.fromDocument(doc)`, `ResponseDto.fromDocuments(docs)`
- i18n validation messages via `$t('validation.key')` in validator decorators

### Search & Pagination
```typescript
// Always use SearchFilterBuilder for query construction
const filter = SearchFilterBuilder.init()
    .withObjectId('_id', query.id)
    .withStringLike('name', query.name)    // WARNING: see security notes
    .withDate('start', query.start)
    .withParam('state', query.state ?? { $ne: State.deleted })
    .build()

const skip = PaginationHelper.calculateSkip(query.page, query.pageSize)
const [found, total] = await Promise.all([
    this.repository.find(filter, query.pageSize, skip),
    this.repository.countDocuments(filter),
])
return PaginationHelper.wrapResponse(Dto.fromDocuments(found), query.page, query.pageSize, total)
```

### Soft Deletes
Deleted records are soft-deleted: `state = 'deleted'`, `expireAt = oneMonth` (TTL index removes them after 30 days).

### Authorization Pattern
```typescript
@Roles(Role.Manager)
@UseGuards(JwtAuthGuard, RolesGuard)
```
Always apply **both** guards together. Role check alone is not enough without JWT validation.

Controllers receive `request.user` as `TokenUser { id: ObjectId, role: Role }`.

### Polymorphic Tasks (Discriminator Pattern)
The `Task` schema uses Mongoose discriminators keyed on `type`:
- `TaskType.lesson` → `LessonTask` (lessons[], minimumWatchTime)
- `TaskType.assignment` → `AssignmentTask` (assignment ref)
- `TaskType.meeting` → `MeetingTask` (meetingLink, chatRoomId)
- `TaskType.wird` → `WirdTask` (wirdTitle, wirdDetails)
- `TaskType.oralTest` → `OralTestTask` (title, description, meetingLink, slots: embedded `OralTestSlot[]`)

Same pattern applies to `User` → `Student` | `Manager` (discriminator key: `role`).

#### OralTest slot booking flow
- Slots are embedded subdocuments. Booking is atomic via `updateOne` with `$elemMatch` predicate `{ _id: slotId, bookedBy: { $in: [null, undefined] } }` — guarantees exactly one booker wins.
- Cancellation uses `$unset` on booking fields and `$set` on audit fields (`cancelledBy`, `cancelledAt`, `cancellationReason`).
- **Students cannot self-complete oralTest tasks** via `POST /api/tasks/:id/complete` — it returns 406. Completion is triggered automatically when the manager submits the first grade for the student's slot (`POST /api/tasks/:id/slots/:slotId/grade`), which calls `subscriptionService.addCompletedTask`.
- Slot mutation uses dedicated sub-resource endpoints (`POST/PUT/DELETE /api/tasks/:id/slots[/:slotId]`); the generic `PUT /api/tasks/:id` does NOT mutate slots, protecting bookings from accidental wipe.
- Only the owner manager can cancel a booking, grade a slot, or list bookings.

### Migration System
Versioned scripts in `src/shared/database-services/migration-scripts/`. Each migration is a function registered in `migration-scripts.map.ts`. `MigrationService` runs pending migrations at app startup. Current version: v10.

### Logging Convention
Every service has:
```typescript
private readonly logger = new Logger(ServiceName.name)
```
Log pattern: `this.logger.log(...)`, `this.logger.warn(...)`, `this.logger.error(...)`.
Log successes at `log` level, unexpected states at `warn`, failures at `error`.

---

## Authentication & Authorization

- **Two login paths**: Student `POST /api/authentication/login` and Manager `POST /api/authentication/manager-login`.
  - Credentials come from the **JSON request body** `{ email, password }` (passport-local, `usernameField: 'email'`) — **not** Basic auth. Response: `{ name, email, accessToken, refreshToken }`.
- **Access Token**: JWT signed with `JWT_SECRET`, payload: `{ id, role }`
- **Refresh Token**: UUID stored in MongoDB (`refreshtokens` collection, TTL 10 days)
- **Role enum**: `Role.Manager`, `Role.Student`
- **Verification flow**: accounts are created `status: inactive` → email link `GET /api/authentication/verify/:id` → activates (302 redirect to `STUDENT_WEB_URL`/`MANAGEMENT_WEB_URL` + `#/login`). **Both students AND managers require verification**; logging in with an inactive account returns 401.
- **Password reset**: `GET /api/authentication/forgot-password/:email` emails a code → `PUT /api/authentication/change-password` with `{ email, code, password }`.

---

## API Conventions

- All endpoints prefixed with `/api/{resource}`
- Global validation: `I18nValidationPipe` (i18n-aware error messages)
- Global error filters: `SecurityErrorFilter`, `I18nValidationExceptionFilter`
- MongoDB ObjectId params are parsed via `ParseMongoIdPipe`
- Create endpoints return `{ id: string }` with `201 Created`
- Update/Delete endpoints return `204 No Content`
- List endpoints return `{ items[], page, pageSize, total }`

### Pusher channels & events

| Channel | Event | Trigger |
|---|---|---|
| `<chatRoomId>` | `message` | Chat message sent |
| `oral-test-<taskId>` | `slot-booked` | Student books an OralTest slot |
| `student-<studentId>` | `oral-test-booking-cancelled` | Manager cancels a student's booking |
| `student-<studentId>` | `oral-test-graded` | Manager grades a student's OralTest slot |

---

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `PORT` | HTTP port (default 3000) |
| `NODE_ENV` | `development` \| `production` |
| `HOST` | API base URL |
| `STUDENT_WEB_URL` | Student frontend URL |
| `MANAGEMENT_WEB_URL` | Management frontend URL |
| `JWT_SECRET` | JWT signing secret |
| `UPLOAD_FOLDER` | Static file upload directory |
| `PUSHER_APP_ID/KEY/SECRET/CLUSTER` | Pusher credentials |
| `EMAIL_HOST/PORT/SECURE/USER/PASSWORD` | SMTP credentials |

---

## Testing

```bash
npm run test          # Unit tests (Vitest)
npm run test:watch    # Watch mode
npm run test:cov      # Coverage report
npm run test:e2e      # E2E tests (Supertest + mongodb-memory-server)
npm run test:e2e:watch
```

**E2E test helpers** in `src/shared/test/helper/`:
- `MongoTestHelper` — starts in-memory MongoDB, creates NestJS test app
- `JwtMockModule` — bypasses real JWT validation in tests
- Factory methods: `createStudent()`, `createManager()`, `createProgram()`, `createLevel()`, `createTask()`, `createOralTestTask()`, etc.

E2E tests cover: authentication, students, programs, tasks, subscriptions.

---

## Known Issues & Technical Debt

### Security Issues

1. **ReDoS via `withStringLike`** (`src/shared/helper/search-filter.builder.ts:51`)
   — User-supplied strings are placed directly into `{ $regex: value, $options: 'i' }` without sanitization. A crafted regex can cause MongoDB to hang. **Fix: escape special regex characters before passing to `$regex`.**

2. **No rate limiting on auth endpoints**
   — `/api/auth/*/login` and `/api/auth/send-reset-code` have no rate limiting. Brute force and password spray attacks are unrestricted. **Fix: add `@nestjs/throttler`.**

3. **No HTTP security headers (Helmet)**
   — No `helmet()` middleware. Missing CSP, HSTS, X-Frame-Options, X-Content-Type-Options. **Fix: add `helmet` package in `main.ts`.**

4. ~~**Missing `ParseMongoIdPipe` on task delete**~~ — fixed on `refactor-tasks-new` (commit 2c23c41).

5. **`SecurityErrorFilter` crashes on unauthenticated `ForbiddenException`**
   (`src/shared/errors/security-error.filter.ts:35`)
   — `user?.id.toString()` will throw `TypeError: Cannot read properties of undefined (reading 'toString')` when `user` is `undefined`. Optional chaining stops at `user?.id` (returns `undefined`) but `.toString()` is then called on `undefined`. **Fix: `user?.id?.toString()`.**

6. **Weak password reset code** (`src/features/authentication/authentication.service.ts:76`)
   — `uuidv4().substring(0, 8)` produces only 8 hex characters (~32 bits of entropy). Susceptible to brute force without rate limiting. **Fix: use a longer code or a cryptographically random 6-digit numeric OTP with strict rate limiting.**

7. ~~**Task delete missing ownership check**~~ — fixed on `refactor-tasks-new` (commit 2c23c41).

8. ~~**Task complete doesn't validate task belongs to subscribed program**~~ — fixed on `refactor-tasks-new` (commit 2c23c41).

### Code Quality Issues

9. **`await` inside `Promise.all`** — Multiple services use `[await x(), await y()]` inside `Promise.all(...)` which defeats parallelism. Remove the inner `await`s:
   ```typescript
   // Wrong (sequential)
   const [a, b] = await Promise.all([await this.repo.find(...), await this.repo.count(...)])
   // Correct (parallel)
   const [a, b] = await Promise.all([this.repo.find(...), this.repo.count(...)])
   ```
   Affected: `programs.service.ts:71`, `subscriptions.service.ts:120`, possibly others.

10. **N+1 query in `addCompletedTask`** (`src/features/subscriptions/subscriptions.service.ts:207`)
    — Fetches program then loops to fetch each level individually. For programs with many levels this is slow. **Fix: fetch all levels in a single `$in` query.**

11. **`loadThumbnail` mutates Mongoose documents** (`src/features/programs/programs.service.ts:169`)
    — Replaces `program.thumbnail` (a filename) with a URL, mutating the Mongoose document. Calling `.save()` on such a document afterward would persist the URL instead of the filename. **Fix: map to a response DTO before mutation, don't mutate documents.**

12. **No CORS for local development**
    — `main.ts` CORS only allows production domains. Running the API locally requires modifying `main.ts` every time.

---

## Development Commands

```bash
npm run start:dev     # Hot-reload development server
npm run build         # TypeScript compilation
npm run lint          # ESLint
npm run format        # Prettier
npm run test          # Unit tests
npm run test:e2e      # E2E tests
```

Docker:
```bash
docker compose -f docker-compose.dev.yml up
```

**Dev environment gotchas** (observed standing this up locally):
- `start:dev` (`nest start --watch`) needs **`chokidar`** — it's an unlisted peer of `@swc/cli` (`^5.0.0`). Without it watch fails with `Cannot find module 'chokidar'`. Add `chokidar@^5` to devDependencies.
- The dev compose runs `mongodb` as `user: '1000:1000'` against a **host bind-mount** (`./mongodb_data-dev:/data/db`). If that host dir is created by the Docker daemon (root-owned), mongod crash-loops with `Permission denied "/data/db/journal"` (exitCode 100). Either pre-create the dir owned by uid 1000, or switch to a Docker **named volume**.
- CORS in `main.ts` only allows production origins, so a local frontend needs a `localhost` origin added.
- `PusherModule.forRoot` throws at boot if Pusher creds are empty strings — use dummy non-empty values locally (events just no-op).
- Account signup sends an email; with no SMTP configured the request **500s** (the email error propagates). Run a local SMTP catcher (e.g. Mailpit) for the signup/verify/reset flows.
