# Payload & Query Validation Standards

Follow these guidelines to ensure that all incoming data (Body, Query, Params, and Headers) is strictly validated, sanitized, and documented, preventing `500 Internal Server Errors` and database type mismatches.

---

## 1. The "DTO-First" Rule

1. **No Raw Inline Parameters**: Never use unvalidated inline decorators like `@Query('param') param: string` or `@Body('field') field: string` in controllers.
2. **Always Use DTOs**: Create or reuse dedicated DTO classes with `class-validator`, `class-transformer`, and `@nestjs/swagger` decorators.
3. **Validate Route Params**: Every route parameter expecting a UUID (e.g., `:id`, `:branchId`, `:ticketId`) MUST use `ParseUUIDPipe`:
   ```typescript
   @Get(':id')
   findOne(@Param('id', ParseUUIDPipe) id: string) { ... }
   ```

---

## 2. Query Parameter Sanitization & `@Transform`

Query parameters arrive as strings or empty strings (e.g., `?branchId=&addonIds=&promoCode=`).

### A. Optional String & UUID Fields
In NestJS/Express, empty query params (`?branchId=`) produce `""` (empty string). By default, `@IsOptional()` does NOT omit empty strings, which causes `@IsUUID()` to fail or unvalidated strings to reach PostgreSQL as `""` (causing `QueryFailedError: invalid input syntax for type uuid: ""`).
Always sanitize optional strings with `@Transform`:
```typescript
@ApiPropertyOptional({
  description: 'Filter by specific branch ID (UUID)',
  example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
})
@IsOptional()
@Transform(({ value }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(),
)
@IsUUID('4', { message: 'branchId must be a valid UUID v4' })
branchId?: string;
```

### B. Array & Comma-Separated Query Params
Clients may send arrays as `?addonIds=id1&addonIds=id2` or `?addonIds=id1,id2` or `?addonIds=`. Always normalize them:
```typescript
@ApiPropertyOptional({
  description: 'Array of add-on IDs included in checkout',
  type: [String],
})
@IsOptional()
@IsArray()
@IsString({ each: true })
@Transform(({ value }) => {
  if (!value) return undefined;
  if (typeof value === 'string') {
    const parts = value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return parts.length > 0 ? parts : undefined;
  }
  if (Array.isArray(value)) {
    const filtered = value
      .filter((v) => typeof v === 'string' && v.trim().length > 0)
      .map((v) => v.trim());
    return filtered.length > 0 ? filtered : undefined;
  }
  return undefined;
})
addonIds?: string[];
```

### C. Numeric Query Params (Pagination, Limits, Amounts)
Use `@Type(() => Number)` or `@Transform`:
```typescript
@ApiPropertyOptional({ description: 'Page number', default: 1 })
@IsOptional()
@Type(() => Number)
@IsInt()
@Min(1)
page?: number = 1;
```

### D. Boolean Query Flags
In query strings, booleans are sent as `"true"` or `"false"`:
```typescript
@ApiPropertyOptional({ description: 'Filter only active records' })
@IsOptional()
@IsBoolean()
@Transform(({ value }) => value === 'true' || value === true)
onlyActive?: boolean;
```

---

## 3. Request Body Validation (`@Body()`)

1. **Whitelist & Forbid Non-Whitelisted**: All properties accepted by the body MUST be declared on the DTO. Unlisted properties will be rejected by the global `ValidationPipe` (`whitelist: true, forbidNonWhitelisted: true`).
2. **Explicit Enums**: For enum fields, always use `@IsEnum(MyEnum)` with Swagger `@ApiProperty({ enum: MyEnum })`.
3. **Nested DTOs**: If validating nested objects or arrays of objects, use `@ValidateNested()` and `@Type(() => NestedDto)`:
   ```typescript
   @ApiProperty({ type: [OrderItemDto] })
   @IsArray()
   @ValidateNested({ each: true })
   @Type(() => OrderItemDto)
   items: OrderItemDto[];
   ```

---

## 4. Service-Layer Defensive Checks

Never trust that an array or ID list is non-empty before running TypeORM `In(ids)` queries:
```typescript
async validateAddons(addonIds: string[]): Promise<AddOn[]> {
  if (!addonIds || addonIds.length === 0) {
    return [];
  }

  const cleanIds = addonIds.filter(
    (id) => typeof id === 'string' && id.trim().length > 0,
  );

  if (cleanIds.length === 0) {
    return [];
  }

  return this.addonRepository.findBy({
    id: In(cleanIds),
    isActive: true,
  });
}
```

---

## 5. Global Error Handling Safety Net

All unhandled database exceptions are intercepted by [`AllExceptionsFilter`](file:///apps/backend/src/common/filters/http-exception.filter.ts). The filter maps PostgreSQL error codes into proper HTTP client errors:
- **`22P02`** (Type syntax mismatch / invalid UUID) $\rightarrow$ `400 Bad Request`
- **`23505`** (Unique constraint duplicate) $\rightarrow$ `409 Conflict`
- **`23503`** (Foreign key constraint violation) $\rightarrow$ `400 Bad Request`
- **`22001`** (String truncation / value too long) $\rightarrow$ `400 Bad Request`
