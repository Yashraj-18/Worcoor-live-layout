# Render Deployment Guide

## Prerequisites
- GitHub repository with your code
- Render account (free tier available)
- Supabase project and database

## Step 1: Prepare Your Repository
1. Push all changes to GitHub
2. Ensure you have the `render.yaml` file in your root directory
3. Verify your `package.json` files have the correct scripts

## Step 2: Deploy Backend Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Select the root directory
5. Render will detect your `render.yaml` and create both services
6. Set environment variables for the backend:
   - `SUPABASE_PROJECT_ID`: Your Supabase project ID
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `DATABASE_URL`: Your Supabase database connection string
   - `JWT_SECRET`: Generate a secure 32-character string
   - `COOKIE_SECRET`: Generate another secure 32-character string
   - `CORS_ORIGIN`: `https://your-frontend-name.onrender.com`

## Step 3: Deploy Frontend Service
1. After backend deployment, get your backend URL
2. Set `BACKEND_URL` environment variable for frontend:
   - Format: `https://your-backend-name.onrender.com`

## Step 4: Update CORS Origins
1. In your backend service settings, update `CORS_ORIGIN` to include:
   - `https://your-frontend-name.onrender.com`
   - `http://localhost:3000` (for local development)

## Step 5: Verify Deployment
1. Frontend: Visit `https://your-frontend-name.onrender.com`
2. Backend Health Check: Visit `https://your-backend-name.onrender.com/health`
3. Test API endpoints through the frontend

## Environment Variables Reference

### Backend Environment Variables
```
NODE_ENV=production
PORT=4000
HOST=0.0.0.0
CORS_ORIGIN=https://your-frontend-name.onrender.com
SUPABASE_PROJECT_ID=your_project_id
SUPABASE_URL=https://your_project_id.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=postgresql://postgres.your_project_id:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
JWT_SECRET=your_32_char_secret
COOKIE_SECRET=your_32_char_secret
```

### Frontend Environment Variables
```
NODE_ENV=production
BACKEND_URL=https://your-backend-name.onrender.com
```

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure `CORS_ORIGIN` includes your frontend URL
2. **Database Connection**: Verify `DATABASE_URL` is correct and accessible
3. **Build Failures**: Check logs in Render dashboard for specific errors
4. **Environment Variables**: Ensure all required variables are set

### Health Checks
- Backend: `https://your-backend-name.onrender.com/health`
- Frontend: `https://your-frontend-name.onrender.com/`

## Local Development
To run locally with production-like settings:
```bash
# Frontend
npm run build
npm start

# Backend
cd Backend
npm run build
npm start
```

## Cost Considerations
- Free tier includes:
  - 750 hours/month per service
  - 100GB bandwidth
  - Custom domains available on paid plans
- Consider upgrading to paid plans for production workloads
