# GeniusJunior: Thanusha's Learning Pal

A personalized, AI-powered learning application covering Math, Science, Computer Science, and Indian Languages.

## 🚀 How to Deploy on GitHub Pages

1. **Upload Files**: Ensure all files are uploaded to your GitHub repository.
2. **Check Structure**: Make sure the `.github` folder is at the root.
   - Correct: `.github/workflows/deploy.yml`
   - Incorrect: `workflows/deploy.yml` or just `deploy.yml`
3. **Add API Key**:
   - Go to **Settings** -> **Secrets and variables** -> **Actions**.
   - Click **New repository secret**.
   - Name: `API_KEY`
   - Value: [Your Gemini API Key]
4. **Watch Build**:
   - Click the **Actions** tab at the top of the repo.
   - You should see a workflow named "Deploy to GitHub Pages" running.
5. **Enable Pages**:
   - Once the action is Green (Success).
   - Go to **Settings** -> **Pages**.
   - Under **Build and deployment**, ensure source is **Deploy from a branch**.
   - **Important**: If the Action worked, it usually handles this automatically. If not, select the `gh-pages` branch if it exists.

## 📱 Installation (PWA)

- **Mobile**: Open the website in Chrome (Android) or Safari (iOS) and tap "Add to Home Screen".
- **Desktop**: Click the install icon in the address bar (Chrome/Edge).

## 🛠️ Features
- **Personalized Learning Path**: Adaptive curriculum based on age.
- **Dictation Mode**: AI-powered spelling practice with pronunciation.
- **Progress Sync**: Manually sync data between devices via Settings.