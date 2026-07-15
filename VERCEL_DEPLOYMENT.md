# Deploy Quick-Dine to Vercel

Quick-Dine needs two Vercel projects: the React frontend in `client` and the
Express API in `server`.

1. Import this repository twice in Vercel. Set the Root Directory to `server`
   for the API project and `client` for the frontend project.
2. Add `MONGODB_URI` and `JWT_SECRET` to the API project's environment
   variables. Add either `CLOUDINARY_URL` or the three `CLOUDINARY_*` values if
   restaurant image uploads are enabled. See `server/.env.example`.
3. Deploy the API first. Add `VITE_API_URL` to the frontend project with the
   value `https://<your-api-project>.vercel.app/api`, then redeploy it.

The frontend's `vercel.json` contains the SPA rewrite required for direct
links to React Router pages. Do not commit real `.env` files or secrets.
