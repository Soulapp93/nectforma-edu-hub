import React, { Suspense, lazy } from 'react';

const BlogAdmin = lazy(() => import('@/pages/BlogAdmin'));

// Wrapper: re-uses existing BlogAdmin component inside the BackOffice layout
const BOArticles: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto" data-testid="bo-articles">
      <Suspense fallback={<div className="p-6">Chargement...</div>}>
        <BlogAdmin />
      </Suspense>
    </div>
  );
};

export default BOArticles;
