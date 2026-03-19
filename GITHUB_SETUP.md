# Push to GitHub – Step-by-step

Your project is ready for GitHub. Follow these steps:

---

## 1. Set your Git identity (one-time)

If you haven't already, tell Git who you are:

```powershell
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

Use the same email as your GitHub account.

---

## 2. Create the initial commit

```powershell
cd "C:\Users\Vivix\Desktop\Skyddsrum"
git commit -m "Initial commit: Skyddsrum statistics and quiz site"
```

---

## 3. Create a new repository on GitHub

1. Go to [github.com](https://github.com) and sign in
2. Click the **+** in the top-right → **New repository**
3. Name it (e.g. `Skyddsrum` or `skyddsrum-hemsida`)
4. Choose **Public**
5. Do **not** add a README, .gitignore, or license (they already exist)
6. Click **Create repository**

---

## 4. Connect and push

GitHub will show commands. Use these (replace `YOUR_USERNAME` and `YOUR_REPO` with your values):

```powershell
cd "C:\Users\Vivix\Desktop\Skyddsrum"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

Example: if your repo is `https://github.com/vivix/skyddsrum`:

```powershell
git remote add origin https://github.com/vivix/skyddsrum.git
git branch -M main
git push -u origin main
```

---

## 5. Future updates

After changing files:

```powershell
git add -A
git commit -m "Describe your changes"
git push
```

---

## What's already set up

- **.gitignore** – Ignores `node_modules/`, `dist/`, `.env`, logs, editor files
- **Git initialized** – Repo is ready
- **Files staged** – Ready for the first commit
