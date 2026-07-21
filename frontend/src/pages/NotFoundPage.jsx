import React from 'react';
import { Link } from 'react-router-dom';
import { Droplets } from 'lucide-react';

const NotFoundPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-mist px-4 text-center">
    <div className="rounded-lg bg-teal-600 p-2 text-white">
      <Droplets size={22} />
    </div>
    <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Page not found</h1>
    <p className="mt-2 text-sm text-ink/50">The page you're looking for doesn't exist.</p>
    <Link to="/" className="mt-6 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
      Back to home
    </Link>
  </div>
);

export default NotFoundPage;
