# Uploads

This folder stores user-uploaded files.

## Contents

| Subfolder | Description |
|-----------|-------------|
| `cors/` | COR (Certificate of Registration) PDFs |
| `schedules/` | Course schedule PDFs |
| `faces/` | Face registration images |
| `temp/` | Temporary processing files |

## File Naming Convention

```
{upload_type}_{user_id}_{timestamp}_{original_filename}

Examples:
- cor_6_20260131_BSIT4A.pdf
- face_15_20260131_capture.jpg
```

## ⚠️ Important

1. **Do NOT commit uploads to Git** - Add to `.gitignore`
2. **Set file size limits** - Max 10MB per file
3. **Validate file types** - Only accept PDF, PNG, JPG
4. **Clean up temp files** - Delete after processing

## .gitignore Entry

```
uploads/*
!uploads/README.md
```

## Storage Limits

| File Type | Max Size | Retention |
|-----------|----------|-----------|
| COR PDFs | 10 MB | Permanent |
| Face images | 5 MB | Until reregistration |
| Temp files | 10 MB | 24 hours |
