# Disc Golf Journey

A web application for tracking disc golf achievements across different categories.

## Project Structure

- `src/app/` - Main application pages
  - `page.tsx` - Landing page
  - `(auth)/login/page.tsx` - Login page
  - `(auth)/register/page.tsx` - Registration page
  - `dashboard/page.tsx` - Achievement dashboard

- `src/components/` - Reusable components
  - `layout/navbar.tsx` - Navigation bar
  - `achievements/achievement-card.tsx` - Achievement card component

## Features

- Clean, modern UI using Next.js and Tailwind CSS
- Authentication system (login/register pages ready for backend integration)
- Achievement tracking in three categories:
  - Skill Achievements
  - Social Achievements
  - Collection Achievements
- Interactive achievement cards with completion tracking
- Responsive design for all screen sizes

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Lucide React icons

## Running the Project

1. Navigate to the project directory:
   ```bash
   cd disc-golf-journey
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Current State

- Frontend UI implemented
- Sample achievements added
- Firebase authentication configured
- Ready for backend integration
- Authentication system structure in place
- Deployed with GitHub Actions

## Next Steps

- Implement backend authentication
- Add more achievements
- Add achievement tiers/levels
- Implement data persistence
- Add social features
