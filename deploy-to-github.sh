#!/bin/bash

# Deploy Finnish Wealth Tracker to GitHub Pages

echo "🚀 Deploying to GitHub Pages..."

# Initialize git if not already
if [ ! -d .git ]; then
    git init
    git branch -M main
fi

# Create .gitignore
cat > .gitignore << EOF
node_modules/
.DS_Store
*.log
.env
EOF

# Add all files
git add .
git commit -m "Deploy Finnish Wealth Tracker to GitHub Pages"

# Create gh-pages branch
git checkout -b gh-pages

# Push to GitHub (replace with your repo)
echo "📝 Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/finnish-wealth-tracker.git"
echo "3. Run: git push -u origin gh-pages"
echo "4. Go to Settings > Pages > Source: Deploy from branch (gh-pages)"
echo "5. Access at: https://YOUR_USERNAME.github.io/finnish-wealth-tracker"