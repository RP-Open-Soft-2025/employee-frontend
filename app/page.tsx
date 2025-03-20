import { EmployeeDashboard } from '@/components/employee-dashboard';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4 md:p-6">Loading dashboard...</div>}>
      <EmployeeDashboard />
    </Suspense>
  );
} 