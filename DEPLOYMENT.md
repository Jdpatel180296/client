# Deployment Guide

## Backend and Frontend Integration

### Environment Configuration

The project now uses environment variables to configure the API URL:

- **Development**: Uses `http://localhost:4000` (defined in `.env.development`)
- **Production**: Uses `https://post-meeting-generator-gold.vercel.app` (defined in `.env.production`)

### Files Changed

1. **Created Configuration Files**:

   - `src/config.js` - Exports API_URL from environment variables
   - `.env.development` - Development API URL
   - `.env.production` - Production API URL

2. **Updated All Page Components** to import and use `API_URL`:

   - `src/App.jsx`
   - `src/pages/EventsPage.jsx`
   - `src/pages/LoginPage.jsx`
   - `src/pages/PastMeetingsPage.jsx`
   - `src/pages/MeetingDetailPage.jsx`
   - `src/pages/SettingsPage.jsx`

3. **Updated Configuration**:
   - `package.json` - Removed proxy setting (no longer needed)
   - `.gitignore` - Added `.env` to exclude environment files

### Deployment Instructions

#### For Vercel Deployment:

1. **Push your changes to GitHub**:

   ```bash
   git add .
   git commit -m "Configure backend URL for production deployment"
   git push origin main
   ```

2. **Deploy to Vercel**:

   - Your frontend is already deployed at: `https://client-weld-alpha.vercel.app`
   - Vercel will automatically use `.env.production` for production builds
   - The app will connect to backend: `https://post-meeting-generator-gold.vercel.app`

3. **Environment Variables in Vercel** (Optional):
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add `REACT_APP_API_URL` = `https://post-meeting-generator-gold.vercel.app`
   - This will override the `.env.production` file if needed

#### Backend CORS Configuration

Make sure your backend at `https://post-meeting-generator-gold.vercel.app` has CORS configured to allow requests from:

- `https://client-weld-alpha.vercel.app`
- `http://localhost:3000` (for local development)

Example Express.js CORS setup:

```javascript
const cors = require("cors");

app.use(
  cors({
    origin: ["https://client-weld-alpha.vercel.app", "http://localhost:3000"],
    credentials: true,
  })
);
```

### Testing

1. **Local Development**:

   ```bash
   npm start
   ```

   Will use `http://localhost:4000` as the API URL

2. **Production Build**:
   ```bash
   npm run build
   ```
   Will use `https://post-meeting-generator-gold.vercel.app` as the API URL

### Verifying the Integration

After deployment, check your browser console for:

- API requests going to the correct backend URL
- No CORS errors
- Successful API responses

### Troubleshooting

1. **CORS Errors**: Check backend CORS configuration
2. **API URL not working**: Verify `.env.production` has correct URL
3. **Changes not reflecting**: Clear build cache and redeploy on Vercel
