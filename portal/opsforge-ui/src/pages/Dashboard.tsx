import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApplications } from '../api';
import type { Application } from '../api';

const Dashboard: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await getApplications();
      setApplications(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Applications</h1>
        <Link 
          to="/create" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Create Application
        </Link>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {loading ? (
        <div>Loading applications...</div>
      ) : (
        <div className="bg-white shadow-md rounded my-6 overflow-x-auto">
          <table className="min-w-max w-full table-auto">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-left">Environment</th>
                <th className="py-3 px-6 text-center">Replicas</th>
                <th className="py-3 px-6 text-left">Image</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-3 px-6 text-center">No applications found.</td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6 text-left whitespace-nowrap font-bold">{app.name}</td>
                    <td className="py-3 px-6 text-left">
                      <span className="bg-green-200 text-green-600 py-1 px-3 rounded-full text-xs">
                        {app.environment}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center">{app.replicas}</td>
                    <td className="py-3 px-6 text-left">{app.image}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
