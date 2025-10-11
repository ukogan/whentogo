# Staging Deployment Setup Guide

## Overview
You now have three branches:
- **main** → Production deployment (https://whentoleavefortheairport.vercel.app)
- **staging** → Staging deployment (to be set up)
- **development** → Local development only

## Set Up Staging Deployment on Vercel

### Option 1: Automatic Branch Deployments (Recommended)

Vercel automatically creates preview deployments for all branches. Your staging branch is already deployed!

1. Go to https://vercel.com/ukogan/whentogo
2. Click on "Deployments" tab
3. Find the deployment for the `staging` branch
4. The URL will be something like: `https://whentogo-git-staging-ukogan.vercel.app`

**That's it!** Every push to the `staging` branch will automatically deploy.

### Option 2: Custom Domain for Staging (Optional)

If you want a cleaner URL like `staging.whentoleavefortheairport.vercel.app`:

1. Go to Project Settings → Domains
2. Add domain: `staging-whentoleavefortheairport.vercel.app`
3. Point it to the `staging` branch
4. Save

### Option 3: Separate Vercel Project (If you need completely isolated environments)

Only do this if you need totally separate configs/environment variables:

1. Create new Vercel project
2. Import same GitHub repo
3. Point to `staging` branch instead of `main`
4. Different project name (e.g., "whentogo-staging")

## Testing the Staging Deployment

### Find Your Staging URL

Check your Vercel dashboard or use this pattern:
```
https://whentogo-git-staging-ukogan.vercel.app
```

Or find it programmatically:
```bash
# List all deployments
curl -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
  "https://api.vercel.com/v6/deployments?projectId=YOUR_PROJECT_ID"
```

### Test the New Security Selector

1. Open the staging URL on your iPhone
2. Navigate to the trip context form
3. You should see the new pill toggle instead of checkboxes
4. Test the gradient bar animation by switching between:
   - Regular (wide orange bar, 38 min avg)
   - Fast Lane (medium bar, 12 min avg)
   - Biometric (narrow green bar, 8 min avg)

### What to Check

- ✅ Pill toggle slides smoothly between options
- ✅ Gradient bar animates when switching
- ✅ Bar gets shorter and shifts left for faster options
- ✅ Time statistics update (Best/Typical/Worst Case)
- ✅ Works well on mobile (tap targets are large enough)
- ✅ Gradient colors are visible (green → blue → orange)

## Workflow Going Forward

### Development Flow
```
development branch (new features)
    ↓ (test locally)
staging branch (testing on real devices)
    ↓ (verify on iPhone)
main branch (production)
```

### Commands

**Work on new feature:**
```bash
git checkout development
# Make changes
git add .
git commit -m "feat: new feature"
git push origin development
```

**Promote to staging for testing:**
```bash
git checkout staging
git merge development
git push origin staging
# Test at staging URL on iPhone
```

**Promote to production:**
```bash
git checkout main
git merge staging
git push origin main
# Deploys to production
```

## Current Deployment Status

**Production (main branch):**
- URL: https://whentoleavefortheairport.vercel.app
- Features: Original checkbox UI, all paper improvements

**Staging (staging branch):**
- URL: https://whentogo-git-staging-ukogan.vercel.app (verify in Vercel dashboard)
- Features: NEW pill toggle security selector with gradient visualization

**Development (development branch):**
- Not deployed (local only)
- Latest experimental features

## Rollback Plan

If staging has issues:
```bash
git checkout staging
git reset --hard main
git push origin staging --force
```

If production needs emergency rollback:
```bash
# In Vercel dashboard:
# Go to Deployments → Find previous good deployment → Click "Promote to Production"
```

## Environment Variables

Both production and staging use the same environment (no secrets needed for this app). If you later add API keys:

1. Vercel Dashboard → Project Settings → Environment Variables
2. Set different values for Production vs Preview (staging)

## Monitoring

Check build status:
- Vercel Dashboard → Deployments
- GitHub → Actions tab (if you add CI/CD later)

Check runtime errors:
- Vercel Dashboard → Project → Analytics
- Browser console on staging URL

## Next Steps

1. **Find your staging URL** in Vercel dashboard
2. **Open it on your iPhone** to test the new UI
3. **Verify the gradient animations** work smoothly
4. **Test all three options** (Regular, Fast Lane, Biometric)
5. **Complete a full flow** to ensure calculations still work
6. If everything looks good → **merge staging to main**
